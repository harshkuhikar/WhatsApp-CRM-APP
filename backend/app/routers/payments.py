from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import stripe
import razorpay
from app.database import get_db
from app.models import User, Payment, PaymentStatus
from app.auth import get_current_user
from app.config import settings

router = APIRouter()

# Initialize payment providers
stripe.api_key = settings.STRIPE_SECRET_KEY
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)) if settings.RAZORPAY_KEY_ID else None


class CreateCheckoutRequest(BaseModel):
    provider: str  # "stripe" or "razorpay"
    plan: str
    amount: float
    currency: str = "USD"
    success_url: str
    cancel_url: str


@router.post("/create")
async def create_checkout(
    request: CreateCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create payment checkout session"""
    
    if request.provider == "stripe":
        if not settings.STRIPE_SECRET_KEY:
            raise HTTPException(status_code=400, detail="Stripe not configured")
        
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': request.currency.lower(),
                        'product_data': {
                            'name': f'MyWASender - {request.plan}',
                        },
                        'unit_amount': int(request.amount * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=request.success_url,
                cancel_url=request.cancel_url,
                client_reference_id=str(current_user.id),
                metadata={
                    'user_id': current_user.id,
                    'plan': request.plan
                }
            )
            
            # Create payment record
            payment = Payment(
                user_id=current_user.id,
                provider="stripe",
                provider_payment_id=session.id,
                amount=request.amount,
                currency=request.currency,
                plan=request.plan,
                status=PaymentStatus.PENDING
            )
            db.add(payment)
            db.commit()
            
            return {
                "checkout_url": session.url,
                "session_id": session.id
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    elif request.provider == "razorpay":
        if not razorpay_client:
            raise HTTPException(status_code=400, detail="Razorpay not configured")
        
        try:
            order = razorpay_client.order.create({
                'amount': int(request.amount * 100),
                'currency': request.currency,
                'payment_capture': 1,
                'notes': {
                    'user_id': current_user.id,
                    'plan': request.plan
                }
            })
            
            # Create payment record
            payment = Payment(
                user_id=current_user.id,
                provider="razorpay",
                provider_payment_id=order['id'],
                amount=request.amount,
                currency=request.currency,
                plan=request.plan,
                status=PaymentStatus.PENDING
            )
            db.add(payment)
            db.commit()
            
            return {
                "order_id": order['id'],
                "amount": order['amount'],
                "currency": order['currency'],
                "key_id": settings.RAZORPAY_KEY_ID
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    else:
        raise HTTPException(status_code=400, detail="Invalid payment provider")


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Handle checkout.session.completed
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        payment = db.query(Payment).filter(
            Payment.provider_payment_id == session['id']
        ).first()
        
        if payment:
            payment.status = PaymentStatus.COMPLETED
            payment.completed_at = datetime.utcnow()
            db.commit()
            
            # TODO: Generate and send license to user
    
    return {"status": "success"}


@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Razorpay webhooks"""
    
    payload = await request.json()
    
    # Verify webhook signature
    # TODO: Implement Razorpay signature verification
    
    if payload['event'] == 'payment.captured':
        payment_data = payload['payload']['payment']['entity']
        
        payment = db.query(Payment).filter(
            Payment.provider_payment_id == payment_data['order_id']
        ).first()
        
        if payment:
            payment.status = PaymentStatus.COMPLETED
            payment.completed_at = datetime.utcnow()
            payment.meta_data = {'razorpay_payment_id': payment_data['id']}
            db.commit()
            
            # TODO: Generate and send license to user
    
    return {"status": "success"}


@router.get("/history")
async def get_payment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user payment history"""
    
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()
    
    return {
        "payments": [
            {
                "id": p.id,
                "provider": p.provider,
                "amount": float(p.amount),
                "currency": p.currency,
                "status": p.status.value,
                "plan": p.plan,
                "created_at": p.created_at.isoformat(),
                "completed_at": p.completed_at.isoformat() if p.completed_at else None
            } for p in payments
        ]
    }

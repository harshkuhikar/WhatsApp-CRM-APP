"""Initialize database and create test user"""
from app.database import engine, Base, SessionLocal
from app.models import User, UserRole
from app.auth import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

# Create test user
db = SessionLocal()

# Check if user exists
existing_user = db.query(User).filter(User.email == "test@example.com").first()
if not existing_user:
    test_user = User(
        email="test@example.com",
        password_hash=get_password_hash("password123"),
        role=UserRole.USER
    )
    db.add(test_user)
    print("✓ Test user created: test@example.com / password123")
else:
    print("✓ Test user already exists")

# Check if admin exists
existing_admin = db.query(User).filter(User.email == "admin@example.com").first()
if not existing_admin:
    admin_user = User(
        email="admin@example.com",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN
    )
    db.add(admin_user)
    print("✓ Admin user created: admin@example.com / admin123")
else:
    print("✓ Admin user already exists")

db.commit()
db.close()

print("\n✅ Database initialized successfully!")
print("\n📝 Test Credentials:")
print("   User:  test@example.com / password123")
print("   Admin: admin@example.com / admin123")

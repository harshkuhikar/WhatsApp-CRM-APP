import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, get_db
from app.models import User, UserRole
from app.auth import get_password_hash
from sqlalchemy.orm import sessionmaker

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_database():
    Base.metadata.create_all(bind=engine)
    
    # Create admin user
    db = TestingSessionLocal()
    admin = User(
        email="admin@test.com",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN
    )
    db.add(admin)
    db.commit()
    db.close()
    
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def admin_token(setup_database):
    """Get admin access token"""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "admin123"}
    )
    return response.json()["access_token"]


def test_generate_license(admin_token):
    """Test license generation"""
    response = client.post(
        "/api/v1/licenses/generate",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "owner_email": "customer@test.com",
            "plan": "premium",
            "days": 365,
            "max_devices": 2
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert "human_key" in data
    assert data["plan"] == "premium"
    return data


def test_activate_license(admin_token):
    """Test license activation"""
    # Generate license first
    license_data = test_generate_license(admin_token)
    
    # Activate
    response = client.post(
        "/api/v1/licenses/activate",
        json={
            "token": license_data["token"],
            "hwid": "test-hwid-123",
            "device_info": {"platform": "test"}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


def test_validate_license(admin_token):
    """Test license validation"""
    # Generate and activate license
    license_data = test_generate_license(admin_token)
    client.post(
        "/api/v1/licenses/activate",
        json={
            "token": license_data["token"],
            "hwid": "test-hwid-456",
            "device_info": {}
        }
    )
    
    # Validate
    response = client.post(
        "/api/v1/licenses/validate",
        json={
            "token": license_data["token"],
            "hwid": "test-hwid-456"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True


def test_revoke_license(admin_token):
    """Test license revocation"""
    # Generate license
    license_data = test_generate_license(admin_token)
    
    # Revoke
    response = client.post(
        f"/api/v1/licenses/revoke/{license_data['license_id']}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

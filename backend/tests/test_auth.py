import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, get_db
from sqlalchemy.orm import sessionmaker

# Test database
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
    yield
    Base.metadata.drop_all(bind=engine)


def test_register(setup_database):
    """Test user registration"""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_register_duplicate_email(setup_database):
    """Test registration with duplicate email"""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 400


def test_login(setup_database):
    """Test user login"""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_wrong_password(setup_database):
    """Test login with wrong password"""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpass"}
    )
    assert response.status_code == 401


def test_get_current_user(setup_database):
    """Test getting current user info"""
    # Login first
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    # Get user info
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


def test_refresh_token(setup_database):
    """Test token refresh"""
    # Login first
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    refresh_token = login_response.json()["refresh_token"]
    
    # Refresh
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

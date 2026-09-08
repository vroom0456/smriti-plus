"""
SMRITI+ Backend — Unit Tests for Authentication & JWT
"""

import uuid
from app.core.auth import hash_password, verify_password, create_access_token, decode_token


def test_password_hashing():
    pin = "1234"
    hashed = hash_password(pin)
    assert hashed != pin
    assert verify_password(pin, hashed) is True
    assert verify_password("0000", hashed) is False


def test_jwt_token_creation_and_decoding():
    user_id = uuid.uuid4()
    role = "elderly"
    token = create_access_token(user_id=user_id, role=role)
    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "elderly"


def test_caregiver_token_claims():
    cg_id = uuid.uuid4()
    token = create_access_token(user_id=cg_id, role="caregiver")
    payload = decode_token(token)
    assert payload["sub"] == str(cg_id)
    assert payload["role"] == "caregiver"


def test_signup_schema():
    from app.api.schemas import SignupRequest
    req = SignupRequest(
        name="Pranab Gogoi",
        role="elderly",
        email="pranab@smriti.local",
        password="4321",
        language="as",
    )
    assert req.role == "elderly"
    assert req.name == "Pranab Gogoi"
    assert req.language == "as"

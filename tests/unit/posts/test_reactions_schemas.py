from uuid import uuid4

import pytest
from pydantic import ValidationError

from src.core.models.enums import ReactionType
from src.core.schemas.reactions import (
    ReactionCreate,
    ReactionRead,
    ReactionSummary,
    PostReactionsResponse,
)


class TestReactionCreateSchema:
    def test_valid_reaction_create(self):
        data = {"reaction_type": ReactionType.like}
        reaction = ReactionCreate(**data)
        assert reaction.reaction_type == ReactionType.like

    def test_valid_reaction_create_love(self):
        data = {"reaction_type": ReactionType.love}
        reaction = ReactionCreate(**data)
        assert reaction.reaction_type == ReactionType.love

    def test_valid_reaction_create_laugh(self):
        data = {"reaction_type": ReactionType.laugh}
        reaction = ReactionCreate(**data)
        assert reaction.reaction_type == ReactionType.laugh

    def test_valid_reaction_create_sad(self):
        data = {"reaction_type": ReactionType.sad}
        reaction = ReactionCreate(**data)
        assert reaction.reaction_type == ReactionType.sad

    def test_valid_reaction_create_angry(self):
        data = {"reaction_type": ReactionType.angry}
        reaction = ReactionCreate(**data)
        assert reaction.reaction_type == ReactionType.angry

    def test_missing_required_field(self):
        data = {}
        with pytest.raises(ValidationError):
            ReactionCreate(**data)

    def test_invalid_reaction_type(self):
        data = {"reaction_type": "invalid"}
        with pytest.raises(ValidationError):
            ReactionCreate(**data)


class TestReactionReadSchema:
    def test_valid_reaction_read(self):
        post_id = uuid4()
        member_id = uuid4()
        data = {
            "post_id": post_id,
            "member_id": member_id,
            "reaction_type": ReactionType.like,
            "action": "add",
        }
        reaction = ReactionRead(**data)
        assert reaction.post_id == post_id
        assert reaction.member_id == member_id
        assert reaction.reaction_type == ReactionType.like
        assert reaction.action == "add"

    def test_valid_reaction_read_with_null_reaction_type(self):
        post_id = uuid4()
        member_id = uuid4()
        data = {
            "post_id": post_id,
            "member_id": member_id,
            "reaction_type": None,
            "action": "remove",
        }
        reaction = ReactionRead(**data)
        assert reaction.reaction_type is None
        assert reaction.action == "remove"

    def test_missing_required_fields(self):
        data = {"post_id": uuid4()}
        with pytest.raises(ValidationError):
            ReactionRead(**data)


class TestReactionSummarySchema:
    def test_valid_reaction_summary(self):
        data = {"reaction_type": "like", "count": 42}
        summary = ReactionSummary(**data)
        assert summary.reaction_type == "like"
        assert summary.count == 42

    def test_zero_count(self):
        data = {"reaction_type": "love", "count": 0}
        summary = ReactionSummary(**data)
        assert summary.count == 0

    def test_large_count(self):
        data = {"reaction_type": "laugh", "count": 999999}
        summary = ReactionSummary(**data)
        assert summary.count == 999999

    def test_missing_fields(self):
        data = {"reaction_type": "like"}
        with pytest.raises(ValidationError):
            ReactionSummary(**data)

        data = {"count": 10}
        with pytest.raises(ValidationError):
            ReactionSummary(**data)


class TestPostReactionsResponseSchema:
    def test_valid_response(self):
        post_id = uuid4()
        data = {
            "post_id": post_id,
            "reactions": {"like": 10, "love": 5, "laugh": 3},
            "total": 18,
        }
        response = PostReactionsResponse(**data)
        assert response.post_id == post_id
        assert response.reactions == {"like": 10, "love": 5, "laugh": 3}
        assert response.total == 18

    def test_empty_reactions(self):
        post_id = uuid4()
        data = {
            "post_id": post_id,
            "reactions": {},
            "total": 0,
        }
        response = PostReactionsResponse(**data)
        assert response.reactions == {}
        assert response.total == 0

    def test_single_reaction(self):
        post_id = uuid4()
        data = {
            "post_id": post_id,
            "reactions": {"like": 1},
            "total": 1,
        }
        response = PostReactionsResponse(**data)
        assert response.reactions["like"] == 1
        assert response.total == 1

    def test_missing_required_fields(self):
        data = {"post_id": uuid4()}
        with pytest.raises(ValidationError):
            PostReactionsResponse(**data)

        data = {"reactions": {"like": 5}}
        with pytest.raises(ValidationError):
            PostReactionsResponse(**data)

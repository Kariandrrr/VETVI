from datetime import datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from src.core.models.enums import PostType
from src.core.schemas.post import (
    PostBase,
    PostCreate,
    PostUpdate,
    PostRead,
    PostWithReactionSummary,
)


class TestPostBaseSchema:
    def test_valid_post_base_text(self):
        data = {
            "post_type": PostType.text,
            "title": "My First Post",
            "body": "This is the content of my post",
        }
        post = PostBase(**data)
        assert post.post_type == PostType.text
        assert post.title == "My First Post"
        assert post.body == "This is the content of my post"

    def test_valid_post_base_minimal(self):
        data = {}
        post = PostBase(**data)
        assert post.post_type == PostType.text
        assert post.title is None
        assert post.body is None

    def test_valid_post_base_photo(self):
        data = {"post_type": PostType.photo}
        post = PostBase(**data)
        assert post.post_type == PostType.photo

    def test_valid_post_base_title_max_length(self):
        data = {"title": "a" * 300}
        post = PostBase(**data)
        assert len(post.title) == 300

    def test_invalid_title_too_long(self):
        data = {"title": "a" * 301}
        with pytest.raises(ValidationError) as exc_info:
            PostBase(**data)
        assert "title" in str(exc_info.value)


class TestPostCreateSchema:
    def test_valid_post_create(self):
        data = {
            "post_type": PostType.text,
            "title": "Test Post",
            "body": "Test content",
            "attributed_to_member_id": uuid4(),
        }
        post = PostCreate(**data)
        assert post.post_type == PostType.text
        assert post.title == "Test Post"
        assert post.body == "Test content"
        assert post.attributed_to_member_id is not None

    def test_valid_post_create_without_attributed_member(self):
        data = {
            "title": "Anonymous Post",
            "body": "Content",
        }
        post = PostCreate(**data)
        assert post.post_type == PostType.text
        assert post.title == "Anonymous Post"
        assert post.attributed_to_member_id is None

    def test_valid_post_create_minimal(self):
        data = {"body": "Just content"}
        post = PostCreate(**data)
        assert post.post_type == PostType.text
        assert post.title is None
        assert post.body == "Just content"
        assert post.attributed_to_member_id is None


class TestPostUpdateSchema:
    def test_partial_update_title_only(self):
        data = {"title": "Updated Title"}
        update = PostUpdate(**data)
        assert update.title == "Updated Title"
        assert update.body is None

    def test_partial_update_body_only(self):
        data = {"body": "Updated content"}
        update = PostUpdate(**data)
        assert update.title is None
        assert update.body == "Updated content"

    def test_full_update(self):
        data = {"title": "New Title", "body": "New content"}
        update = PostUpdate(**data)
        assert update.title == "New Title"
        assert update.body == "New content"

    def test_empty_update(self):
        data = {}
        update = PostUpdate(**data)
        assert update.title is None
        assert update.body is None

    def test_update_title_max_length(self):
        data = {"title": "a" * 300}
        update = PostUpdate(**data)
        assert len(update.title) == 300

    def test_invalid_title_too_long_in_update(self):
        data = {"title": "a" * 301}
        with pytest.raises(ValidationError):
            PostUpdate(**data)


class TestPostReadSchema:
    def test_valid_post_read_minimal(self):
        post_id = uuid4()
        user_id = uuid4()
        now = datetime.now()

        data = {
            "id": post_id,
            "user_id": user_id,
            "attributed_to_member_id": None,
            "created_at": now,
            "updated_at": now,
            "post_type": PostType.text,
            "media": [],
            "tags": [],
            "reactions": [],
        }
        post = PostRead(**data)
        assert post.id == post_id
        assert post.user_id == user_id
        assert post.attributed_to_member_id is None
        assert post.created_at == now
        assert post.updated_at == now
        assert post.post_type == PostType.text
        assert post.media == []
        assert post.tags == []
        assert post.reactions == []

    def test_valid_post_read_with_media(self):
        media_id = uuid4()
        post_id = uuid4()
        media = {
            "id": media_id,
            "post_id": post_id,
            "original_name": "photo.jpg",
            "stored_name": "abc123.jpg",
            "mime_type": "image/jpeg",
            "file_size_bytes": 1024,
            "sort_order": 0,
            "created_at": datetime.now(),
        }
        tag_id = uuid4()
        family_group_id = uuid4()
        tag = {
            "id": tag_id,
            "name": "vacation",
            "family_group_id": family_group_id,
        }
        reaction = {
            "reaction_type": "like",
            "count": 5,
        }

        data = {
            "id": uuid4(),
            "user_id": uuid4(),
            "attributed_to_member_id": uuid4(),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "post_type": PostType.photo,
            "title": "Vacation Photos",
            "body": "Great memories",
            "media": [media],
            "tags": [tag],
            "reactions": [reaction],
        }
        post = PostRead(**data)
        assert len(post.media) == 1
        assert post.media[0].id == media_id
        assert post.media[0].original_name == "photo.jpg"
        assert len(post.tags) == 1
        assert post.tags[0].name == "vacation"
        assert len(post.reactions) == 1
        assert post.reactions[0].reaction_type == "like"

    def test_missing_required_fields(self):
        data = {"id": uuid4()}
        with pytest.raises(ValidationError):
            PostRead(**data)

    def test_invalid_post_type(self):
        data = {
            "id": uuid4(),
            "user_id": uuid4(),
            "attributed_to_member_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "post_type": "invalid_type",
            "media": [],
            "tags": [],
            "reactions": [],
        }
        with pytest.raises(ValidationError):
            PostRead(**data)


class TestPostWithReactionSummarySchema:
    def test_valid_with_reaction_summary(self):
        post_id = uuid4()
        now = datetime.now()

        data = {
            "id": post_id,
            "user_id": uuid4(),
            "attributed_to_member_id": None,
            "created_at": now,
            "updated_at": now,
            "post_type": PostType.text,
            "title": "Test",
            "media": [],
            "tags": [],
            "reactions": [],
            "reaction_counts": {"like": 10, "love": 5},
            "user_reaction": "like",
        }
        post = PostWithReactionSummary(**data)
        assert post.reaction_counts == {"like": 10, "love": 5}
        assert post.user_reaction == "like"

    def test_valid_without_user_reaction(self):
        data = {
            "id": uuid4(),
            "user_id": uuid4(),
            "attributed_to_member_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "post_type": PostType.text,
            "media": [],
            "tags": [],
            "reactions": [],
            "reaction_counts": {"like": 0},
            "user_reaction": None,
        }
        post = PostWithReactionSummary(**data)
        assert post.reaction_counts == {"like": 0}
        assert post.user_reaction is None

    def test_empty_reaction_counts(self):
        data = {
            "id": uuid4(),
            "user_id": uuid4(),
            "attributed_to_member_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "post_type": PostType.text,
            "media": [],
            "tags": [],
            "reactions": [],
            "reaction_counts": {},
            "user_reaction": None,
        }
        post = PostWithReactionSummary(**data)
        assert post.reaction_counts == {}

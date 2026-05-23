from datetime import datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from src.core.schemas.media_tags import (
    TagBase,
    TagCreate,
    TagUpdate,
    TagRead,
    MediaFileRead,
    MediaFileUploadResponse,
)


class TestTagBaseSchema:
    def test_valid_tag_base(self):
        data = {"name": "vacation"}
        tag = TagBase(**data)
        assert tag.name == "vacation"

    def test_missing_name(self):
        data = {}
        with pytest.raises(ValidationError):
            TagBase(**data)


class TestTagCreateSchema:
    def test_valid_tag_create(self):
        data = {"name": "family"}
        tag = TagCreate(**data)
        assert tag.name == "family"

    def test_tag_create_inheritance(self):
        assert issubclass(TagCreate, TagBase)


class TestTagUpdateSchema:
    def test_valid_tag_update(self):
        data = {"name": "updated_tag"}
        tag = TagUpdate(**data)
        assert tag.name == "updated_tag"

    def test_tag_update_inheritance(self):
        assert issubclass(TagUpdate, TagBase)


class TestTagReadSchema:
    def test_valid_tag_read(self):
        tag_id = uuid4()
        family_group_id = uuid4()
        data = {
            "id": tag_id,
            "name": "holidays",
            "family_group_id": family_group_id,
        }
        tag = TagRead(**data)
        assert tag.id == tag_id
        assert tag.name == "holidays"
        assert tag.family_group_id == family_group_id

    def test_missing_required_fields(self):
        data = {"id": uuid4()}
        with pytest.raises(ValidationError):
            TagRead(**data)

        data = {"name": "test"}
        with pytest.raises(ValidationError):
            TagRead(**data)

    def test_config_from_attributes(self):
        assert TagRead.Config.from_attributes is True


class TestMediaFileReadSchema:
    def test_valid_media_file_read(self):
        file_id = uuid4()
        post_id = uuid4()
        now = datetime.now()

        data = {
            "id": file_id,
            "post_id": post_id,
            "original_name": "image.png",
            "stored_name": "abc123def.png",
            "mime_type": "image/png",
            "file_size_bytes": 2048,
            "sort_order": 1,
            "created_at": now,
        }
        media = MediaFileRead(**data)
        assert media.id == file_id
        assert media.post_id == post_id
        assert media.original_name == "image.png"
        assert media.stored_name == "abc123def.png"
        assert media.mime_type == "image/png"
        assert media.file_size_bytes == 2048
        assert media.sort_order == 1
        assert media.created_at == now

    def test_zero_file_size(self):
        data = {
            "id": uuid4(),
            "post_id": uuid4(),
            "original_name": "empty.txt",
            "stored_name": "empty.txt",
            "mime_type": "text/plain",
            "file_size_bytes": 0,
            "sort_order": 0,
            "created_at": datetime.now(),
        }
        media = MediaFileRead(**data)
        assert media.file_size_bytes == 0

    def test_large_file_size(self):
        data = {
            "id": uuid4(),
            "post_id": uuid4(),
            "original_name": "video.mp4",
            "stored_name": "video123.mp4",
            "mime_type": "video/mp4",
            "file_size_bytes": 10**9,  # 1 GB
            "sort_order": 0,
            "created_at": datetime.now(),
        }
        media = MediaFileRead(**data)
        assert media.file_size_bytes == 10**9

    def test_negative_sort_order(self):
        data = {
            "id": uuid4(),
            "post_id": uuid4(),
            "original_name": "test.jpg",
            "stored_name": "test.jpg",
            "mime_type": "image/jpeg",
            "file_size_bytes": 100,
            "sort_order": -1,
            "created_at": datetime.now(),
        }
        media = MediaFileRead(**data)
        assert media.sort_order == -1

    def test_missing_required_fields(self):
        data = {"id": uuid4()}
        with pytest.raises(ValidationError):
            MediaFileRead(**data)

    def test_config_from_attributes(self):
        assert MediaFileRead.Config.from_attributes is True


class TestMediaFileUploadResponseSchema:
    def test_valid_upload_response(self):
        file_id = uuid4()
        post_id = uuid4()
        now = datetime.now()

        data = {
            "id": file_id,
            "post_id": post_id,
            "original_name": "document.pdf",
            "stored_name": "doc123.pdf",
            "mime_type": "application/pdf",
            "file_size_bytes": 51200,
            "sort_order": 2,
            "created_at": now,
        }
        response = MediaFileUploadResponse(**data)
        assert response.id == file_id
        assert response.post_id == post_id
        assert response.original_name == "document.pdf"
        assert response.stored_name == "doc123.pdf"
        assert response.mime_type == "application/pdf"
        assert response.file_size_bytes == 51200
        assert response.sort_order == 2
        assert response.created_at == now

    def test_upload_response_inheritance(self):
        assert issubclass(MediaFileUploadResponse, MediaFileRead)

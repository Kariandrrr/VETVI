import enum


class MembershipRole(enum.Enum):
    admin = "admin"
    editor = "editor"
    viewer = "viewer"


class GenderEnum(enum.Enum):
    male = "male"
    female = "female"
    other = "other"
    unknown = "unknown"


class RelationshipType(enum.Enum):
    parent_child = "parent_child"
    spouse = "spouse"
    sibling = "sibling"


class PostType(enum.Enum):
    text = "text"
    photo = "photo"
    audio = "audio"
    video = "video"
    document = "document"


class ReactionType(enum.Enum):
    like = "like"
    love = "love"
    haha = "haha"
    wow = "wow"
    sad = "sad"
    angry = "angry"
    laugh = "laugh"

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    content VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for comments
CREATE INDEX idx_comments_media_id ON comments(media_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

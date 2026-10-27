CREATE TABLE order_reviews (
 order_id uuid PRIMARY KEY REFERENCES orders(id),
 rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_completed_service ON orders(service_id) WHERE status='completed';

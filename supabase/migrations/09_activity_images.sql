-- =========================================================
-- JULELY DB — SCRIPT 9: GALERÍA DE IMÁGENES POR EXCURSIÓN
-- Requiere: 03_destinations.sql (tabla activities)
-- =========================================================

CREATE TABLE activity_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id   UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_images_activity_id ON activity_images(activity_id);

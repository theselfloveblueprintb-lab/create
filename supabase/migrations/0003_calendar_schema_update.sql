-- PRD-008 — Calendar Intelligence Engine
-- Extends 0001's availability_block table with two fields PRD-008 needs
-- that weren't anticipated when that table was first defined as a
-- "prepare structure, integrate later" stub. New migration, not an edit
-- to 0001, same append-only pattern as 0002.

alter table availability_block drop constraint if exists availability_block_availability_type_check;
alter table availability_block
  add constraint availability_block_availability_type_check
  check (availability_type in ('free', 'flexible', 'busy', 'travel', 'work', 'family', 'sleep', 'holiday'));

alter table availability_block add column if not exists work_location text check (work_location in ('office', 'home'));
alter table availability_block add column if not exists label text;

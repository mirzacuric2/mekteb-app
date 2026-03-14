-- Import official BIF communities list (Dzemati/Forsamlingar).
WITH source (
  name,
  street_line_1,
  street_line_2,
  postal_code,
  city,
  country,
  contact_phone
) AS (
  VALUES
    ('BIF Borås', 'Teknikgatan 9', NULL, '504 62', 'Borås', 'Sweden', '076 329 53 01'),
    ('BIF Gislaved', 'Sörgårdsvägen 3', NULL, '332 37', 'Gislaved', 'Sweden', '0700 257 435'),
    ('BIF Göteborg', 'Generalsgatan 5', NULL, '415 05', 'Göteborg', 'Sweden', '076 036 29 40'),
    ('BIF Halmstad', 'Gesällgatan 2 A', NULL, '302 55', 'Halmstad', 'Sweden', '0729-26 19 37'),
    ('BIF Helsingborg', 'Bjäregatan 10', NULL, '252 48', 'Helsingborg', 'Sweden', '042 457 17 30'),
    ('BIF Kalmar', 'Två Bröders Väg 35', NULL, '39358', 'Kalmar', 'Sweden', NULL),
    ('BIF Karlstad', 'Horsensgatan 220', NULL, '654 58', 'Karlstad', 'Sweden', '0738792576'),
    ('BIF Landskrona', 'Engelbrektsgatan 5', NULL, '261 33', 'Landskrona', 'Sweden', '0418-100 83'),
    ('BIF Linköping', 'Snickaregatan 31 A', NULL, '582 26', 'Linköping', 'Sweden', '013-10 54 60'),
    ('BIF Malmö', 'Ystad vägen 42', 'Poštanska adresa: Box 8120, 200 41 Malmö', '200 41', 'Malmö', 'Sweden', '0733583864'),
    ('BIF Motala', 'Agneshögsgatan 77', NULL, '591 71', 'Motala', 'Sweden', '0709-37 55 03'),
    ('BIF Norrköping', 'Norra Promenaden 125', NULL, '602 22', 'Norrköping', 'Sweden', '0735739659'),
    ('BIF Oskarshamn', 'Stengatan 11', NULL, '572 55', 'Oskarshamn', 'Sweden', '0738-48 61 23'),
    ('BIF Skövde', 'Gamla Karstorpsvägen 2', 'Poštanska adresa: Box 7, 541 21 Skövde', '541 41', 'Skövde', 'Sweden', '0704 714886, 0704 970418'),
    ('BIF Stockholm', 'Frodevägen 8', NULL, '163 43', 'Spånga', 'Sweden', '08-653 68 21'),
    ('BIF Surte', 'Göteborgsvägen 76', 'Poštanska adresa: Box 2103, 445 02 Surte', '445 57', 'Surte', 'Sweden', '0704 648762, 0707 680946'),
    ('BIF Trelleborg', 'Hedvägen 172', NULL, '231 66', 'Trelleborg', 'Sweden', '076-070 85 32'),
    ('BIF Trollhättan', 'Gjutmästaregatan 1', NULL, '461 54', 'Trollhättan', 'Sweden', '072 281 05 24'),
    ('BIF Varberg', 'Träslövsvägen 60', NULL, '432 43', 'Varberg', 'Sweden', '0340-677 374'),
    ('BIF Vetlanda', 'Kyrkogatan 39', NULL, '574 31', 'Vetlanda', 'Sweden', '0383-150 74'),
    ('BIF Värnamo', 'Myntgatan (gula huset)', 'Västermogatan 27, Värnamo', '331 30', 'Värnamo', 'Sweden', '0370-65 76 00'),
    ('BIF Västerås', 'Ritargatan 4', NULL, '724 66', 'Västerås', 'Sweden', '0706-57 78 65'),
    ('BIF Växjö', 'Arabygatan 80', NULL, '352 46', 'Växjö', 'Sweden', '0704-07 89 42'),
    ('BIF Örebro', 'Karlslundsgatan 81', NULL, '703 47', 'Örebro', 'Sweden', '019-18 48 26')
),
upsert_addresses AS (
  INSERT INTO "Address" (
    "id",
    "streetLine1",
    "streetLine2",
    "postalCode",
    "city",
    "country",
    "updatedAt"
  )
  SELECT
    md5('address:' || s.street_line_1 || '|' || s.postal_code || '|' || s.city || '|' || s.country),
    s.street_line_1,
    s.street_line_2,
    s.postal_code,
    s.city,
    s.country,
    NOW()
  FROM source s
  ON CONFLICT ("streetLine1", "postalCode", "city", "country")
  DO UPDATE SET
    "streetLine2" = EXCLUDED."streetLine2",
    "updatedAt" = NOW()
  RETURNING "id", "streetLine1", "postalCode", "city", "country"
)
INSERT INTO "Community" (
  "id",
  "name",
  "description",
  "contactPhone",
  "addressId",
  "isActive",
  "deactivatedAt",
  "updatedAt"
)
SELECT
  md5('community:' || s.name),
  s.name,
  'Seeded from official BIF communities list',
  s.contact_phone,
  a.id,
  true,
  NULL,
  NOW()
FROM source s
JOIN "Address" a
  ON a."streetLine1" = s.street_line_1
 AND a."postalCode" = s.postal_code
 AND a."city" = s.city
 AND a."country" = s.country
ON CONFLICT ("name")
DO UPDATE SET
  "description" = EXCLUDED."description",
  "contactPhone" = EXCLUDED."contactPhone",
  "addressId" = EXCLUDED."addressId",
  "isActive" = true,
  "deactivatedAt" = NULL,
  "updatedAt" = NOW();

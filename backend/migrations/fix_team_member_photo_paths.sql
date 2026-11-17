-- Filenames containing "&" broke the Next.js image optimizer (the query string
-- was cut at the ampersand), so the team photos rendered as broken images.

UPDATE team_members SET photo_url = '/assets/members/co-founder-ceo.jpeg'
WHERE photo_url = '/assets/members/Co-Founder & CEO.jpeg';

UPDATE team_members SET photo_url = '/assets/members/co-founder-cto.png'
WHERE photo_url = '/assets/members/Co-Founder & CTO.png';

UPDATE team_members SET photo_url = '/assets/members/co-founder-coo.jpg'
WHERE photo_url = '/assets/members/Co-Founder & COO.jpg';

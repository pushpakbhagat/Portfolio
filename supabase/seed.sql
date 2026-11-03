-- Starting content. Only verified facts: the StudentHub and Interview Analyzer READMEs and the skills
-- listed in the project brief. Anything unknown (education, jobs, certifications, dates, results,
-- location, email) is left empty for you to fill in from /admin.
-- Safe to run more than once: every insert is skipped when the row already exists.

-- The intro and about text below are drafts written from the facts above; rewrite them in your own
-- words from /admin → Profile. Availability defaults to "open": change it if that is not true.
insert into public.profile (id, full_name, titles, intro, about, availability)
values (
  1,
  'Pushpak Bhagat',
  array['Software Developer'],
  'I build full-stack web applications with React, Node.js, Express and Django.',
  E'I''m a software developer who builds full-stack web applications, from the interface to the API and the database.\n\nRecent work includes StudentHub, a student management system with role-based access, QR check-in and a weighted gradebook, and Smart Interview Analyzer, which transcribes spoken interview answers and scores them with AI.',
  'open'
)
on conflict (id) do nothing;

insert into public.site_settings (id, site_title, site_description, nav_links, sections)
values (
  1,
  'Pushpak Bhagat — Software Developer',
  'Portfolio of Pushpak Bhagat: full-stack web applications built with React, Node.js, Express and Django.',
  '[{"label": "About", "href": "#about"}, {"label": "Work", "href": "#work"},
    {"label": "Experience", "href": "#experience"}, {"label": "Contact", "href": "#contact"}]',
  '{"focus": true, "skills": true, "projects": true, "experience": true, "education": true,
    "accomplishments": true, "github": true, "contact": true}'
)
on conflict (id) do nothing;

insert into public.admin_settings (id) values (1) on conflict (id) do nothing;

insert into public.social_links (platform, label, url, sort_order)
select * from (values
  ('github', 'GitHub', 'https://github.com/pushpakbhagat', 1),
  ('linkedin', 'LinkedIn', 'https://linkedin.com/in/pushpak-bhagat', 2)
) v(platform, label, url, sort_order)
where not exists (select 1 from public.social_links);

-- Skills ------------------------------------------------------------------------------------------

insert into public.skill_categories (name, sort_order) values
  ('Programming Languages', 1),
  ('Frontend Development', 2),
  ('Backend Development', 3),
  ('Databases', 4),
  ('Tools and Technologies', 5)
on conflict (name) do nothing;

insert into public.skills (category_id, name, icon_slug, sort_order)
select c.id, s.name, s.icon_slug, s.sort_order
from (values
  ('Programming Languages', 'JavaScript', 'javascript', 1),
  ('Programming Languages', 'Python', 'python', 2),
  ('Programming Languages', 'Java', 'openjdk', 3),
  ('Frontend Development', 'HTML', 'html5', 1),
  ('Frontend Development', 'CSS', 'css', 2),
  ('Frontend Development', 'React', 'react', 3),
  ('Frontend Development', 'Tailwind CSS', 'tailwindcss', 4),
  ('Frontend Development', 'Zustand', '', 5),
  ('Backend Development', 'Node.js', 'nodedotjs', 1),
  ('Backend Development', 'Express.js', 'express', 2),
  ('Backend Development', 'Django', 'django', 3),
  ('Databases', 'MongoDB', 'mongodb', 1),
  ('Databases', 'PostgreSQL', 'postgresql', 2),
  ('Tools and Technologies', 'Git', 'git', 1),
  ('Tools and Technologies', 'GitHub', 'github', 2)
) s(category, name, icon_slug, sort_order)
join public.skill_categories c on c.name = s.category
on conflict ((lower(name))) do nothing;

insert into public.focus_areas (title, description, sort_order)
select * from (values
  ('Frontend development', 'Interfaces in React and Tailwind CSS, with client state in Zustand.', 1),
  ('Backend and APIs', 'REST APIs in Node.js and Express, and web applications in Django.', 2),
  ('Databases', 'Data models in MongoDB and PostgreSQL.', 3)
) v(title, description, sort_order)
where not exists (select 1 from public.focus_areas);

-- Projects ----------------------------------------------------------------------------------------

insert into public.projects (
  slug, title, summary, overview, solution, architecture, features, challenges, category,
  github_url, live_url, is_featured, publish_status, published_at, sort_order
) values (
  'studenthub',
  'StudentHub',
  'A student management system for admins, teachers and students: records, courses, attendance, grades, assignments and announcements.',
  'StudentHub is a full-stack MERN application for running a school''s day-to-day work. Admins run everything; teachers manage attendance, grades, assignments and announcements for the courses they are assigned; students only ever see their own data.',
  'One application with three roles enforced by the server. Attendance can be recorded by date or by QR check-in, the gradebook weights quizzes, assignments and exams, and an insights view flags at-risk students from low attendance, failing grades and absence streaks.',
  E'React 19 + Vite frontend with Tailwind CSS, Zustand stores (session, admin data, student portal data) and React Router.\n\nExpress 5 API on Node.js with a layered backend (routes → controllers → models) and central error handling; MongoDB through Mongoose.\n\nJWT in an httpOnly cookie, bcrypt-hashed passwords, Helmet headers and login rate limiting. OpenAPI 3 docs served with Swagger UI, with a test that fails if a route is undocumented.\n\nDocker Compose runs MongoDB, the API and nginx. CI runs the API tests (node:test, Supertest, mongodb-memory-server), lint and build, and Playwright browser tests.',
  array[
    'Three roles (admin, teacher, student) with access enforced by the server',
    'Courses with rosters, assigned teachers and weekly class times; a weekly timetable',
    'Attendance by date: present, late, absent or excused, editable afterwards',
    'QR check-in with a code that changes every few seconds',
    'Weighted gradebook with percentage, letter grade and GPA updating live',
    'Assignments with file or written hand-ins, grading, feedback and late flags',
    'Announcements for everyone or one course, with pinning',
    'Insights: attendance trend, grade distribution and an at-risk list',
    'Printable report cards, CSV export and a notifications menu',
    'Light and dark mode, Ctrl/⌘ + K command palette, installable PWA'
  ],
  '[
    {"challenge": "Stopping students from marking attendance for someone who is not in the room.",
     "solution": "The classroom screen shows a QR code that changes every few seconds, so a photo of it is useless outside the room. Finishing check-in marks everyone else absent."},
    {"challenge": "Keeping cookie-based sessions safe from CSRF and from accounts that no longer exist.",
     "solution": "State-changing requests must come from an allowed origin and use JSON bodies. The account is re-checked on every request, so deleted users lose access immediately, and changing a password signs out other devices."},
    {"challenge": "Making sure students only ever see their own courses and assignments.",
     "solution": "Role checks and course scoping run on the server for every route; teachers are limited to the courses they are assigned."}
  ]',
  'Full-stack web application',
  'https://github.com/pushpakbhagat/Student-Management-System',
  'https://student-managment-system-by-pushpak.netlify.app',
  true, 'published', now(), 1
), (
  'interview-analyzer',
  'Smart Interview Analyzer',
  'Practice spoken interviews: role-specific questions tailored to your resume, answered out loud and scored by AI with tips to improve.',
  'A full-stack web app for practising spoken interviews. Candidates get role-specific questions, optionally tailored to their resume, answer out loud and receive AI scoring and tips. Interviewers review every candidate''s results.',
  'Each interview has 8 questions (3 easy, 3 medium, 2 hard), read aloud, with up to 2 minutes per spoken answer. Answers are transcribed with Whisper and graded 0–10 with an improvement tip by Llama 3.3 through the Groq API. The final score combines the resume score (40%) and the interview (60%).',
  E'React 19 + Vite frontend with React Router 7 and Tailwind CSS 4.\n\nNode.js + Express 5 API with Mongoose models, Zod validation, Helmet and express-rate-limit. services/ai.js wraps the Groq calls, fences candidate text in prompts and validates model output; services/access.js decides who may read or write each interview.\n\nWithout MONGO_URI the backend starts its own MongoDB; without a Groq key it runs in demo mode with simulated analysis, so it can be developed and tested with no external services.',
  array[
    'Mock interviews: 8 questions per interview, read aloud, up to 2 minutes per answer',
    'Resume analysis from a PDF: score, skills, summary and suggested roles',
    'AI scoring: Whisper transcription and 0–10 grading with an improvement tip',
    'Interview integrity: fullscreen and camera, server-counted tab and focus violations, voided after 3',
    'Reports with per-question scores, verdicts, transcripts and a final score',
    'Interviewer view of every candidate with search and pagination',
    'httpOnly cookie sessions, password rules and rate-limited login'
  ],
  '[
    {"challenge": "Keeping interviews honest when the candidate controls the browser.",
     "solution": "Fullscreen and camera are required, tab and focus violations are counted on the server, the interview is voided after 3, each interview has a deadline and answers cannot be redone."},
    {"challenge": "Trusting AI grading when candidates can type anything into their answers.",
     "solution": "Candidate text is fenced off in prompts and every model response is validated and clamped before it is stored."},
    {"challenge": "Developing and testing without a database or an API key.",
     "solution": "The backend starts its own MongoDB when none is configured and falls back to a demo-mode AI, so the API tests need neither."}
  ]',
  'Full-stack web application · AI',
  'https://github.com/pushpakbhagat/Interview_Analyzer',
  '',
  true, 'published', now(), 2
)
on conflict (slug) do nothing;

select public.set_technologies('project', id, array[
  'React', 'Vite', 'Tailwind CSS', 'Zustand', 'React Router', 'Node.js', 'Express', 'MongoDB',
  'Mongoose', 'JWT', 'Docker', 'Playwright', 'OpenAPI'
])
from public.projects
where slug = 'studenthub' and not exists (
  select 1 from public.project_technologies pt where pt.project_id = projects.id
);

select public.set_technologies('project', id, array[
  'React', 'Vite', 'Tailwind CSS', 'React Router', 'Node.js', 'Express', 'MongoDB', 'Mongoose', 'Zod',
  'Groq', 'Whisper', 'Llama 3.3'
])
from public.projects
where slug = 'interview-analyzer' and not exists (
  select 1 from public.project_technologies pt where pt.project_id = projects.id
);

update public.technologies t set icon_slug = v.slug
from (values
  ('React', 'react'), ('Vite', 'vite'), ('Tailwind CSS', 'tailwindcss'), ('React Router', 'reactrouter'),
  ('Node.js', 'nodedotjs'), ('Express', 'express'), ('MongoDB', 'mongodb'), ('Mongoose', 'mongoose'),
  ('JWT', 'jsonwebtokens'), ('Docker', 'docker'), ('OpenAPI', 'openapiinitiative'),
  ('Zod', 'zod')
) v(name, slug)
where lower(t.name) = lower(v.name) and t.icon_slug = '';

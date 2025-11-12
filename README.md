Framez is a mobile social application built with React Native and Supabase, inspired by Instagram + Tiktok. It allows users to sign up, create profiles, and share posts with a global feed. The app features a clean UI, real-time data, and a full authentication flow, complete with "likes," "bookmarks," "comments," and user search.

It also includes database management, storage, security policies, and client-side state management.

✨ Key Features
This app is fully functional and includes the following features:

Full Authentication:
- Secure Sign-up (with profile creation)
- Email & Password Login
- Secure Logout (with confirmation)
- Persistent user sessions (remain logged in after app restart).
Profile System:
- Users create a username, bio, and upload a profile picture on sign-up.
- Edit Profile: Users can update their image, username, and bio.
- Profile Page: A dedicated tab showing a user's avatar, bio, and all their posts in a grid.
Post Creation:
- Users can create new posts with a single image (from the camera roll) and a text caption.
Interactive Feed (Home Screen):
- A global feed of posts from all users.
- Functional Likes: Tap the heart icon to "like" a post. The count updates instantly.
- Functional Bookmarks: Tap the bookmark icon to "save" a post for later.
- Comments: Tap the comment icon to view or add comments.
Profile Tabs:
- My Posts: A grid of all posts created by the user.
- Liked Posts: A grid of all posts the user has liked.
- Saved Posts: A grid of all posts the user has bookmarked.
Social Features:
- User Search: A new "Search" tab for finding other users by username.
- Public User Profiles: The ability to tap any user's name to see their profile and posts.
- Recent Searches: The search screen saves and displays your recent searches.
- Comments: A full comment section on the post detail page.
Post Management:
- Tapping a post in the profile grid opens a "Post Detail" screen.
- Users can delete their own posts.

🛠️ Tech Stack
This project was built using a modern, full-stack TypeScript environment.
Frontend:
- React Native (managed with Expo)
- TypeScript
- React Navigation: For all stack and tab-based navigation.
- Zustand: For simple, powerful global state management (user session).
- Custom Fonts: Uses expo-font with the Poppins font for a professional UI.
Backend (BaaS):
- Supabase
- Supabase Auth: For user management and authentication.
- Supabase Database (PostgreSQL): For storing posts, profiles, likes, and saved posts.
- Supabase Storage: For hosting all user-uploaded images.
- PostgREST (SQL Functions): Used custom plpgsql functions to efficiently fetch posts with like counts, user details, and bookmark status in a single query.
- Row Level Security (RLS): All tables are secured with database policies to ensure users can only edit their own data.

🚀 How to Run This Project
To run this project locally, you will need to set up your own Supabase backend.

1. Clone the Repository
Bash

git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
2. Install Dependencies
Bash

npm install
3. Set Up Supabase
You must create a free Supabase project to act as your backend.

Create a Project: Go to Supabase.com and create a new project.

Run the SQL Script:

Inside your new project, go to the SQL Editor.

Click "+ New query".

Copy the entire contents of the setup.sql script (provided below) and paste it into the editor.

Click "RUN". This will create all your tables, storage buckets, and security policies in one go.

4. Connect the App to Supabase
In your Supabase project, go to Project Settings > API.

Find your Project URL and your anon (public) API Key.

In the root of the React Native project, find the file named supabaseClient.ts.

Open supabaseClient.ts and replace the placeholder keys with your own:

TypeScript

// supabaseClient.ts
const supabaseUrl = 'YOUR_PROJECT_URL_HERE';
const supabaseAnonKey = 'YOUR_ANON_KEY_HERE';
Disable Email Confirmation:

In your Supabase project, go to Authentication > Settings.

Turn OFF the "Confirm email" toggle.

5. Run the App
You are now ready to run the app on your mobile device.

Bash

npx expo start
Scan the QR code with the Expo Go app on your iOS or Android phone.

📜 Full Supabase setup.sql Script
Copy all the code below and run it in your Supabase SQL Editor.

SQL

-- 1. CREATE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. CREATE 'profiles' TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 150)
);

-- 3. CREATE 'posts' TABLE
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  text_content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE 'likes' TABLE
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- 5. CREATE 'saved_posts' TABLE
CREATE TABLE public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- 6. CREATE 'comments' TABLE
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT content_length CHECK (char_length(content) > 0)
);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES FOR 'profiles'
CREATE POLICY "Allow users to insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);

-- 9. RLS POLICIES FOR 'posts'
CREATE POLICY "Allow logged-in users to create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow anyone to read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Allow users to delete their own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. RLS POLICIES FOR 'likes'
CREATE POLICY "Allow authenticated users to create likes" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to delete likes" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow public read access to likes" ON public.likes FOR SELECT USING (true);

-- 11. RLS POLICIES FOR 'saved_posts'
CREATE POLICY "Allow authenticated users to save posts" ON public.saved_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to unsave posts" ON public.saved_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to read their own saved posts" ON public.saved_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 12. RLS POLICIES FOR 'comments'
CREATE POLICY "Allow public read access to comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 13. RLS POLICIES FOR STORAGE
CREATE POLICY "Allow logged-in users to upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Allow public to view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Allow logged-in users to upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');
CREATE POLICY "Allow public to view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');

-- 14. CREATE DATABASE FUNCTIONS (FOR EFFICIENT QUERIES)

-- FUNCTION 1: get_posts_with_details
CREATE FUNCTION get_posts_with_details()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  text_content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  profiles JSON,
  like_count BIGINT,
  liked_by_user BOOLEAN,
  bookmarked_by_user BOOLEAN,
  comment_count BIGINT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.user_id, p.text_content, p.image_url, p.created_at,
    json_build_object('username', pr.username, 'avatar_url', pr.avatar_url) AS profiles,
    (SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id) AS like_count,
    EXISTS (SELECT 1 FROM public.likes l WHERE l.post_id = p.id AND l.user_id = auth.uid()) AS liked_by_user,
    EXISTS (SELECT 1 FROM public.saved_posts s WHERE s.post_id = p.id AND s.user_id = auth.uid()) AS bookmarked_by_user,
    (SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id) AS comment_count
  FROM
    public.posts p
  LEFT JOIN
    public.profiles pr ON p.user_id = pr.id
  ORDER BY
    p.created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- FUNCTION 2: get_my_saved_posts
CREATE FUNCTION get_my_saved_posts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  text_content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  profiles JSON,
  like_count BIGINT,
  liked_by_user BOOLEAN,
  bookmarked_by_user BOOLEAN,
  comment_count BIGINT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.user_id, p.text_content, p.image_url, p.created_at,
    json_build_object('username', pr.username, 'avatar_url', pr.avatar_url) AS profiles,
    (SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id) AS like_count,
    EXISTS (SELECT 1 FROM public.likes l WHERE l.post_id = p.id AND l.user_id = auth.uid()) AS liked_by_user,
    true AS bookmarked_by_user,
    (SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id) AS comment_count
  FROM
    public.posts p
  JOIN public.saved_posts s ON p.id = s.post_id
  LEFT JOIN public.profiles pr ON p.user_id = pr.id
  WHERE s.user_id = auth.uid()
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- FUNCTION 3: get_my_liked_posts
CREATE FUNCTION get_my_liked_posts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  text_content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  profiles JSON,
  like_count BIGINT,
  liked_by_user BOOLEAN,
  bookmarked_by_user BOOLEAN,
  comment_count BIGINT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.user_id, p.text_content, p.image_url, p.created_at,
    json_build_object('username', pr.username, 'avatar_url', pr.avatar_url) AS profiles,
    (SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id) AS like_count,
    true AS liked_by_user,
    EXISTS (SELECT 1 FROM public.saved_posts s WHERE s.post_id = p.id AND s.user_id = auth.uid()) AS bookmarked_by_user,
    (SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id) AS comment_count
  FROM
    public.posts p
  JOIN public.likes l ON p.id = l.post_id
  LEFT JOIN public.profiles pr ON p.user_id = pr.id
  WHERE l.user_id = auth.uid()
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- FUNCTION 4: get_comments_for_post
CREATE FUNCTION get_comments_for_post(post_id_input UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  profiles JSON
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.content,
    c.created_at,
    json_build_object('username', pr.username, 'avatar_url', pr.avatar_url) AS profiles
  FROM
    public.comments c
  LEFT JOIN
    public.profiles pr ON c.user_id = pr.id
  WHERE
    c.post_id = post_id_input
  ORDER BY
    c.created_at ASC;
END;
$$ LANGUAGE plpgsql;

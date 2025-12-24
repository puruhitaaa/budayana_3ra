import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Components
import BackgroundMusic from "./components/BackgroundMusic.jsx"
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx"
import GuestRoute from "./components/auth/GuestRoute.jsx"

// Core pages
import Home from "./pages/Home.jsx"
import Sign_Up from "./pages/auth/Sign_Up.jsx"
import Log_in from "./pages/auth/Log_in.jsx"
import Profile from "./pages/Profile.jsx"

import Results from "./pages/Results.jsx"

// Dynamic pages (unified architecture)
import TestPage from "./pages/tests/TestPage.jsx"
import GamePage from "./pages/games/GamePage.jsx"
import StoryPage from "./pages/stories/StoryPage.jsx"
import ProfileLayout from "./components/layout/ProfileLayout.jsx"

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Global background music */}
        <BackgroundMusic />

        <Routes>
          {/* ========================================
              PROTECTED ROUTES - Requires authentication
              ======================================== */}
          <Route element={<ProtectedRoute />}>
            {/* Home */}
            <Route index element={<Home />} />

            {/* Story routes */}
            <Route path='/islands/:islandSlug/story'>
              {/* Static story with flipbook (requires storyId) */}
              <Route path=':storyId' element={<StoryPage />} />
              {/* Pre/Post tests */}
              <Route
                path=':storyId/pre-test'
                element={<TestPage testType='pre' />}
              />
              <Route
                path=':storyId/post-test'
                element={<TestPage testType='post' />}
              />
            </Route>

            {/* Game route */}
            <Route
              path='/islands/:islandSlug/story/:storyId/game'
              element={<GamePage />}
            />

            {/* Profile routes with nested layout */}
            <Route path='/profile' element={<ProfileLayout />}>
              <Route index element={<Profile />} />
              <Route path='results' element={<Results />} />
            </Route>
          </Route>

          {/* ========================================
              GUEST ROUTES - Redirect if already logged in
              ======================================== */}
          <Route element={<GuestRoute />}>
            <Route path='/sign-up' element={<Sign_Up />} />
            <Route path='/login' element={<Log_in />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

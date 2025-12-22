import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Components
import BackgroundMusic from "./components/BackgroundMusic.jsx"

// Core pages
import Home from "./pages/Home.jsx"
import Sign_Up from "./pages/auth/Sign_Up.jsx"
import Log_in from "./pages/auth/Log_in.jsx"
import Profile from "./pages/Profile.jsx"

// Dynamic pages (unified architecture)
import TestPage from "./pages/tests/TestPage.jsx"
import GamePage from "./pages/games/GamePage.jsx"
import StoryPage from "./pages/stories/StoryPage.jsx"

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Global background music */}
        <BackgroundMusic />

        <Routes>
          {/* Home */}
          <Route index element={<Home />} />

          {/* Story: /islands/:islandSlug/story */}
          <Route path='/islands/:islandSlug/story'>
            <Route index element={<StoryPage />} />
            <Route
              path=':storyId/pre-test'
              element={<TestPage testType='pre' />}
            />
            <Route
              path=':storyId/post-test'
              element={<TestPage testType='post' />}
            />
          </Route>

          {/* Game: /islands/:islandSlug/story/:storyId/game */}
          <Route
            path='/islands/:islandSlug/story/:storyId/game'
            element={<GamePage />}
          />

          {/* Auth */}
          <Route path='/sign-up' element={<Sign_Up />} />
          <Route path='/login' element={<Log_in />} />
          <Route path='/profile' element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

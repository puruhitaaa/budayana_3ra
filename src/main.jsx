import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "./styles/index.css"

const queryClient = new QueryClient()

// Core pages
import Home from "./pages/Home.jsx"
import Sign_Up from "./pages/auth/Sign_Up.jsx"
import Log_in from "./pages/auth/Log_in.jsx"
import Profile from "./pages/Profile.jsx"

// Dynamic pages (unified architecture)
import TestPage from "./pages/tests/TestPage.jsx"
import GamePage from "./pages/games/GamePage.jsx"
import StoryPage from "./pages/stories/StoryPage.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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

          {/* Game: /islands/:islandSlug/game */}
          <Route path='/islands/:islandSlug/game' element={<GamePage />} />

          {/* Auth */}
          <Route path='/sign-up' element={<Sign_Up />} />
          <Route path='/login' element={<Log_in />} />
          <Route path='/profile' element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)

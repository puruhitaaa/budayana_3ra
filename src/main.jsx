import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "./styles/index.css"

const queryClient = new QueryClient()

import Home from "./pages/Home.jsx"
import StoryBookJawa from "./pages/stories/StoryBookJawa.jsx"
import StoryBookPapua from "./pages/stories/StoryBookPapua.jsx"
import SulawesiGame from "./pages/games/SulawesiGame.jsx"
import SumatraGame from "./pages/games/SumatraGame.jsx"
import PreTestSulawesi from "./pages/tests/PreTestSulawesi.jsx"
import PostTestSulawesi from "./pages/tests/PostTestSulawesi.jsx"
import PreTestSumatra from "./pages/tests/PreTestSumatra.jsx"
import PostTestSumatra from "./pages/tests/PostTestSumatra.jsx"
import PreTestJawa from "./pages/tests/PreTestJawa.jsx"
import PostTestJawa from "./pages/tests/PostTestJawa.jsx"
import PreTestPapua from "./pages/tests/PreTestPapua.jsx"
import PostTestPapua from "./pages/tests/PostTestPapua.jsx"
import Sign_Up from "./pages/auth/Sign_Up.jsx"
import Log_in from "./pages/auth/Log_in.jsx"
import Profile from "./pages/Profile.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />
          <Route path='/pre-test-sulawesi' element={<PreTestSulawesi />} />
          <Route path='/post-test-sulawesi' element={<PostTestSulawesi />} />
          <Route path='/pre-test-sumatra' element={<PreTestSumatra />} />
          <Route path='/post-test-sumatra' element={<PostTestSumatra />} />
          <Route path='/pre-test-jawa' element={<PreTestJawa />} />
          <Route path='/post-test-jawa' element={<PostTestJawa />} />
          <Route path='/pre-test-papua' element={<PreTestPapua />} />
          <Route path='/post-test-papua' element={<PostTestPapua />} />
          <Route path='/cerita-rakyat/jawa' element={<StoryBookJawa />} />
          <Route path='/cerita-rakyat/papua' element={<StoryBookPapua />} />
          <Route path='/sulawesi-game' element={<SulawesiGame />} />
          <Route path='/sumatra-game' element={<SumatraGame />} />
          <Route path='/sign-up' element={<Sign_Up />} />
          <Route path='/login' element={<Log_in />} />
          <Route path='/profile' element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)

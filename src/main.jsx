import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import StoryBookJawa from "./StoryBookJawa.jsx";
import StoryBookPapua from "./StoryBookPapua.jsx";
import SulawesiGame from "./SulawesiGame.jsx";
import SumatraGame from "./SumatraGame.jsx";
import PreTestSulawesi from "./PreTestSulawesi.jsx";
import PostTestSulawesi from "./PostTestSulawesi.jsx";
import PreTestSumatra from "./PreTestSumatra.jsx";
import PostTestSumatra from "./PostTestSumatra.jsx";
import PreTestJawa from "./PreTestJawa.jsx";
import PostTestJawa from "./PostTestJawa.jsx";
import PreTestPapua from "./PreTestPapua.jsx";
import PostTestPapua from "./PostTestPapua.jsx";
import Home from "./Home.jsx";
import Sign_in from "./Sign_in.jsx";
import Log_in from "./Log_in.jsx";
import Profile from "./Profile.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/pre-test-sulawesi" element={<PreTestSulawesi />} />
        <Route path="/post-test-sulawesi" element={<PostTestSulawesi />} />
        <Route path="/pre-test-sumatra" element={<PreTestSumatra />} />
        <Route path="/post-test-sumatra" element={<PostTestSumatra />} />
        <Route path="/pre-test-jawa" element={<PreTestJawa />} />
        <Route path="/post-test-jawa" element={<PostTestJawa />} />
        <Route path="/pre-test-papua" element={<PreTestPapua />} />
        <Route path="/post-test-papua" element={<PostTestPapua />} />
        <Route path="/cerita-rakyat/jawa" element={<StoryBookJawa />} />
        <Route path="/cerita-rakyat/papua" element={<StoryBookPapua />} />
        <Route path="/sulawesi-game" element={<SulawesiGame />} />
        <Route path="/sumatra-game" element={<SumatraGame />} />
        <Route path="/signin" element={<Sign_in />} />
        <Route path="/login" element={<Log_in />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
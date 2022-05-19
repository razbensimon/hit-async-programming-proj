import React from "react";
import { createRoot } from 'react-dom/client';

import "./index.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import {
    Navigation,
    Footer,
    Home,
    Report,
} from "./components";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
    <Router>
        <Navigation />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Report" element={<Report />} />
        </Routes>
        <Footer />
    </Router>,
);

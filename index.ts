import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

const { useState } = React;

// --- TYPE DEFINITIONS ---
interface FeaturedWork {
    thumbnail?: string;
    title: string;
    description?: string;
    tools: string[];
    role: string;
}

interface ContactLink {
    name: string;
    url: string;
}

interface PortfolioData {
    name: string;
    title: string;
    aboutMe: string;
    toolsAndSoftware: string[];
    featuredWorks: FeaturedWork[];
    contact: {
        email: string;
        links: ContactLink[];
    };
}

// --- EDIT YOUR PORTFOLIO DATA HERE ---
// This is your "simple CMS". Update the values below and the site will change.
const portfolioData: PortfolioData = {
  name: "Alex Doe",
  title: "Creative Technologist & Designer",
  aboutMe: `I'm a passionate creative technologist with a knack for bridging the gap between design and development. With a background in both visual arts and computer science, I specialize in creating intuitive, beautiful, and functional user experiences. This portfolio is a showcase of my journey and the work I'm most proud of.`,
  toolsAndSoftware: [
    "React", "TypeScript", "Node.js", "Figma", "Blender", "Photoshop", "ComfyUI", "Python", "TailwindCSS"
  ],
  featuredWorks: [
    {
      thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop",
      title: "Project Cyberspace",
      description: "An interactive 3D web experience showcasing futuristic data visualizations. Built with Three.js and React.",
      tools: ["React", "Three.js", "GLSL"],
      role: "Lead Developer",
    },
    {
      thumbnail: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop",
      title: "Design System UI Kit",
      description: "A comprehensive UI kit and component library to streamline design and development workflows for a SaaS product.",
      tools: ["Figma", "TypeScript", "Storybook"],
      role: "UI/UX Designer",
    },
    {
        thumbnail: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=1976&auto=format&fit=crop",
        title: "AI-Powered Art Generator",
        description: "A generative art tool using ComfyUI workflows, allowing users to create unique visuals from text prompts.",
        tools: ["ComfyUI", "Python", "React"],
        role: "AI Workflow Designer",
      },
    {
        // This project is missing a description and thumbnail to test fallback logic
        title: "Internal Dashboard",
        tools: ["React", "Material-UI"],
        role: "Frontend Developer",
    }
  ],
  contact: {
    email: "hello@alexdoe.com",
    links: [
      { name: "LinkedIn", url: "#" },
      { name: "GitHub", url: "#" },
      { name: "ArtStation", url: "#" },
    ]
  },
};
// --- END OF EDITABLE DATA ---

const ToolBadge = ({ tool }: { tool: string }) => (
  React.createElement('span', { className: "font-fira text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full" }, tool)
);

const ProjectCard = ({ project }: { project: FeaturedWork }) => {
    // Test logic: Fallback for missing thumbnail
    const thumbnailUrl = project.thumbnail || 'https://images.unsplash.com/photo-1542990253-a781e04c0082?q=80&w=1974&auto=format&fit=crop';
    
    return React.createElement('div', { className: "bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300" },
        React.createElement('img', { src: thumbnailUrl, alt: project.title || 'Project thumbnail', className: "w-full h-48 object-cover" }),
        React.createElement('div', { className: "p-6" },
            React.createElement('h3', { className: "font-bold text-xl mb-2 text-gray-900 dark:text-white" }, project.title || 'Untitled Project'),
            React.createElement('p', { className: "font-semibold text-indigo-500 dark:text-indigo-400 mb-2" }, project.role || 'Contributor'),
            // Test logic: Fallback for missing description
            React.createElement('p', { className: "text-gray-700 dark:text-gray-300 mb-4" }, project.description || 'No description available for this project.'),
            React.createElement('div', { className: "flex flex-wrap gap-2" },
                (project.tools || []).map(tool => React.createElement(ToolBadge, { key: tool, tool: tool }))
            )
        )
    );
};

const App = () => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        const { jsPDF } = (window as any).jspdf;
        const html2canvas = (window as any).html2canvas;

        if (!jsPDF || !html2canvas) {
            console.error("PDF generation libraries (jspdf, html2canvas) not found on window object.");
            alert("Could not generate PDF. Libraries not loaded correctly.");
            setIsDownloading(false);
            return;
        }
        
        const portfolioElement = document.getElementById('portfolio-content');
        if (!portfolioElement) {
            console.error("Portfolio content element not found!");
            setIsDownloading(false);
            return;
        }

        const downloadButton = document.getElementById('download-btn');
        if (downloadButton) downloadButton.style.visibility = 'hidden';

        try {
            const canvas = await html2canvas(portfolioElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: window.getComputedStyle(document.body).backgroundColor,
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${(portfolioData.name || 'Portfolio').replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
        } catch(error) {
            console.error("Error generating PDF:", error);
            alert("Could not generate PDF. Check console for details.");
        } finally {
            if (downloadButton) downloadButton.style.visibility = 'visible';
            setIsDownloading(false);
        }
    };

    const downloadButtonContent = isDownloading
        ? React.createElement(React.Fragment, null,
            React.createElement('svg', { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24" },
                React.createElement('circle', { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                React.createElement('path', { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
            ),
            React.createElement('span', null, 'Generating...')
          )
        : React.createElement(React.Fragment, null,
            React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-6 h-6" },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" })
            ),
            React.createElement('span', null, 'Download PDF')
          );

    return React.createElement('div', { className: "max-w-4xl mx-auto p-4 sm:p-8" },
        React.createElement('header', { className: "flex flex-col sm:flex-row justify-between sm:items-center mb-12 gap-4 sm:gap-0" },
            React.createElement('div', null,
                React.createElement('h1', { className: "text-4xl font-bold text-gray-900 dark:text-white" }, portfolioData.name || "Your Name"),
                React.createElement('p', { className: "text-lg text-indigo-500 dark:text-indigo-400" }, portfolioData.title || "Your Title")
            ),
            React.createElement('button', { id: "download-btn", onClick: handleDownloadPdf, disabled: isDownloading, className: "flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed" }, downloadButtonContent)
        ),
        React.createElement('main', { id: "portfolio-content" },
            React.createElement('section', { className: "mb-12" },
                React.createElement('h2', { className: "text-2xl font-bold mb-4 border-b-2 border-indigo-500 pb-2" }, "About Me"),
                React.createElement('p', { className: "text-lg leading-relaxed" }, portfolioData.aboutMe || "A brief description about yourself.")
            ),
            React.createElement('section', { className: "mb-12" },
                React.createElement('h2', { className: "text-2xl font-bold mb-4 border-b-2 border-indigo-500 pb-2" }, "Tools & Software"),
                React.createElement('div', { className: "flex flex-wrap gap-3" },
                    (portfolioData.toolsAndSoftware || []).map(tool => React.createElement(ToolBadge, { key: tool, tool: tool }))
                )
            ),
            React.createElement('section', { className: "mb-12" },
                React.createElement('h2', { className: "text-2xl font-bold mb-4 border-b-2 border-indigo-500 pb-2" }, "Featured Works"),
                React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-8" },
                    (portfolioData.featuredWorks || []).map((project, index) => React.createElement(ProjectCard, { key: index, project: project }))
                )
            ),
            React.createElement('section', null,
                React.createElement('h2', { className: "text-2xl font-bold mb-4 border-b-2 border-indigo-500 pb-2" }, "Contact"),
                React.createElement('div', { className: "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6" },
                    React.createElement('a', { href: `mailto:${portfolioData.contact?.email || ''}`, className: "text-lg text-indigo-600 dark:text-indigo-400 hover:underline" }, portfolioData.contact?.email || "your.email@example.com"),
                    React.createElement('div', { className: "flex items-center gap-4" },
                        (portfolioData.contact?.links || []).map(link => 
                            React.createElement('a', { key: link.name, href: link.url || '#', target: "_blank", rel: "noopener noreferrer", className: "text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors" }, link.name || 'Link')
                        )
                    )
                )
            )
        ),
        React.createElement('footer', { className: "text-center mt-12 py-4 border-t dark:border-gray-700" },
            React.createElement('p', { className: "text-sm text-gray-500 dark:text-gray-400" }, "To update this site, edit the 'portfolioData' object in the index.tsx file.")
        )
    );
};

const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));
} else {
    console.error("Root element with ID 'root' not found in the DOM.");
}


// Basic dark mode toggle logic
const setupDarkMode = () => {
    const toggle = document.createElement('button');
    toggle.textContent = 'Toggle Dark Mode';
    toggle.className = 'fixed bottom-4 right-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg shadow-md';
    document.body.appendChild(toggle);
    toggle.onclick = () => {
        document.documentElement.classList.toggle('dark');
    };
};

setupDarkMode();

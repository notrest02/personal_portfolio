import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

const { useState, useEffect } = React;

// --- Static Portfolio Data (can be moved to Supabase later) ---
const portfolioInfo = {
    name: "ANXION_", // All caps as per request
    title: "Creative Technologist & Designer", // Keep for now, might be removed from display
    contact: {
        email: "notrest02@gmail.com",
        links: [
            { name: "Behance", url: "https://behance.net" }, // Order changed
            { name: "Instagram", url: "https://www.instagram.com/anxion_/" },
        ]
    },
};
// --- END OF STATIC DATA ---

const ProjectDetails = ({ project, onBackClick, transitioning }) => {
    console.log("ProjectDetails rendering. Project data:", project);
    if (!project) return null; // Should not happen if selectedProject is not null

    const [imageError, setImageError] = useState(false);
    const firstDetailedImage = project.detailedContent && Array.isArray(project.detailedContent) ?
        project.detailedContent.flatMap(section => section.elements || []).find(el => el.type === 'image') : null;
    const thumbnailUrl = (firstDetailedImage && firstDetailedImage.url) ? firstDetailedImage.url : (project.thumbnail || 'https://images.unsplash.com/photo-1737265320231-e75f56105fe9?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');

    const containerClassName = `project-details-container ${transitioning ? 'fade-out' : 'fade-in'}`;

    return React.createElement('div', {
        className: containerClassName
    },
        React.createElement('button', {
            onClick: onBackClick,
            className: "back-button" // Updated class
        }, "← Back to Projects"),
        React.createElement('h3', {
            className: "" // Removed specific classes, let CSS handle it
        }, project.title),
        React.createElement('p', {
            className: "" // Removed specific classes, let CSS handle it
        }, project.description),
        project.detailedContent && Array.isArray(project.detailedContent) && project.detailedContent.length > 0 && (
            React.createElement('div', {
                className: "detailed-content-sections",
                style: { marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0' } // Added padding: '0'
            },
                project.detailedContent.map((element, index) => {
                    const elementStyle = {
                        width: '100%', // Ensure elements take full width
                        marginTop: '0px', // Ensure no top margin interferes
                        marginBottom: `${element.marginBottom || 0}px`, // Apply user-defined margin
                        padding: '0' // Ensure no padding within the layer div
                    };

                    return element.type === 'image' ? (
                        React.createElement('div', { 
                            key: index, 
                            style: { ...elementStyle, lineHeight: '0', display: 'flex', justifyContent: 'center' } 
                        },
                            React.createElement('img', {
                                src: element.content, // FIX: Use .content for URL
                                alt: `Detail Image ${index}`,
                                style: { 
                                    maxWidth: '100%',  // Ensure image does not exceed container width
                                    height: 'auto',     // Maintain aspect ratio
                                    display: 'block', 
                                    verticalAlign: 'top', // Keep this for safety
                                    margin: '0', // Add this
                                    padding: '0' // Add this
                                }
                            })
                        )
                    ) : element.type === 'text' ? (
                        React.createElement('div', { key: index, style: elementStyle },
                            React.createElement('p', { style: { fontSize: '0.95rem', color: '#CCCCCC', margin: '0' } }, element.content)
                        )
                    ) : element.type === 'divider' ? (
                        React.createElement('div', { key: index, style: { ...elementStyle, borderTop: '1px solid #444' } })
                    ) : element.type === 'group' ? (
                        React.createElement('div', { 
                            key: index, 
                            style: { 
                                ...elementStyle,
                                display: 'flex', 
                                gap: `${element.imageGap || 15}px`, // Use imageGap here
                                justifyContent: 'center',
                                alignItems: 'flex-start'
                            }
                        },
                            element.content.map((subElement, subIndex) => (
                                React.createElement('div', { 
                                    key: subIndex, 
                                    style: { 
                                        flex: 1, 
                                        lineHeight: '0'
                                    }
                                },
                                    React.createElement('img', {
                                        src: subElement.content,
                                        alt: `Group Image ${index}-${subIndex}`,
                                        style: { 
                                            width: '100%', 
                                            height: 'auto', 
                                            display: 'block', 
                                            verticalAlign: 'top', 
                                            margin: '0', 
                                            padding: '0' 
                                        }
                                    })
                                )
                            ))
                        )
                    ) : null
                })
            )
        )
    );
};

const ProjectGrid = ({ projects, onProjectSelect }) => {
    return React.createElement('div', {
        className: "grid-container"
    },
        projects.map(project => (
            React.createElement('div', {
                key: project.id,
                className: "grid-item", // Updated class
                onClick: () => onProjectSelect(project)
            },
                React.createElement('div', {
                    className: "relative w-full overflow-hidden pb-[75%]" // Container for aspect ratio
                },
                    React.createElement('img', {
                        src: project.thumbnail || 'https://images.unsplash.com/photo-1737265320231-e75f56105fe9?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                        alt: project.title,
                        className: "absolute inset-0", // Keep positioning
                        style: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: project.thumbnailPosition || 'center' } // Added objectPosition
                    })
                ),
                React.createElement('div', {
                    className: "grid-item-content" // Updated class
                },
                    React.createElement('h3', {
                        className: "" // Removed specific classes, let CSS handle it
                    }, project.title)
                )
            )
        ))
    );
};

const App = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [transitioning, setTransitioning] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch(window.API_BASE_URL + '/api/projects', { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setProjects(data);
            } catch (e) {
                console.error("Failed to fetch projects:", e);
                setError(e.message);
            }
        };

        fetchProjects();
    }, []);

    const handleProjectSelect = (project) => {
        if (selectedProject && selectedProject.id !== project.id) {
            setTransitioning(true);
            setTimeout(() => {
                setSelectedProject(project);
                setTransitioning(false);
            }, 300);
        } else if (!selectedProject) {
            setSelectedProject(project);
        }
    };

    const handleBackClick = () => {
        setTransitioning(true);
        setTimeout(() => {
            setSelectedProject(null);
            setTransitioning(false);
        }, 300);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return React.createElement('div', {
        className: "portfolio-container"
    },
        React.createElement('aside', {
            className: ""
        },
            React.createElement('header', {
                className: ""
            },
                React.createElement('h1', {
                    className: ""
                }, portfolioInfo.name),
            ),
            React.createElement('nav', {
                className: ""
            },
                React.createElement('h2', {
                    className: ""
                }, "PORTFOLIO"),
                React.createElement('ul', {
                    className: ""
                },
                    projects.map((project) => (
                        React.createElement('li', {
                            key: project.id
                        },
                            React.createElement('a', {
                                href: `#project-${project.id}`, // Anchor link
                                onClick: (e) => {
                                    e.preventDefault();
                                    handleProjectSelect(project);
                                },
                                className: `project-item-list ${selectedProject && selectedProject.id === project.id ? 'active' : ''}` // Updated class
                            }, project.title)
                        )
                    ))
                )
            ),
            React.createElement('footer', { className: '' },
                React.createElement('h2', {
                    className: ''
                }, 'CONTACT'),
                React.createElement('p', { className: 'contact-email' }, portfolioInfo.contact.email), // Added email
                React.createElement('div', {
                    className: 'social-icons'
                },
                    portfolioInfo.contact.links.map(link => (
                        React.createElement('a',
                            {
                                key: link.name,
                                href: link.url,
                                target: '_blank',
                                rel: 'noopener noreferrer',
                                className: ''
                            },
                            React.createElement('i', { className: `fab fa-${link.name.toLowerCase()}` }),
                            React.createElement('span', { className: 'social-link-name' }, link.name) // Added link name
                        )
                    ))
                )
            )
        ),
        React.createElement('main', {
            className: ""
        },
            selectedProject ?
            React.createElement(ProjectDetails, {
                project: selectedProject,
                onBackClick: handleBackClick,
                transitioning: transitioning
            }) :
            React.createElement(ProjectGrid, {
                projects: projects,
                onProjectSelect: handleProjectSelect
            }),
            React.createElement('a', {
                href: '#',
                onClick: scrollToTop,
                className: 'back-to-top'
            }, 'Back to Top')
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

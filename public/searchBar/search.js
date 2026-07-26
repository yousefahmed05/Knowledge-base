// A central mapping index of all text searchable keywords and where they live
const searchIndex = [
    { title: "Home / Getting Started", url: "/", tags: ["home", "start", "welcome", "overview", "login"] },
    { title: "Service Request Workflow", url: "/serviceReq", tags: ["servicereq", "service", "requests", "tickets", "issues", "priority", "data entry"] },
    { title: "Settings & Custom Fields", url: "/settings", tags: ["settings", "fields", "admin", "custom options", "roles"] }
];

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("globalSearch");
    const resultsDropdown = document.getElementById("searchResults");

    if (!searchInput || !resultsDropdown) return;

    // Optional: Press '/' key to instantly focus search bar like GitHub or linear docs
    document.addEventListener("keydown", (e) => {
        if (e.key === "/" && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    });

    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        resultsDropdown.innerHTML = ""; // Clear old calculations

        if (query === "") {
            resultsDropdown.style.display = "none";
            return;
        }

        // Filter through the mock index to check if title or tags include the query string
        const matches = searchIndex.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.tags.some(tag => tag.includes(query))
        );

        if (matches.length > 0) {
            matches.forEach(match => {
                const link = document.createElement("a");
                link.href = match.url;
                link.className = "search-item";
                link.innerText = match.title;
                resultsDropdown.appendChild(link);
            });
        } else {
            const noResults = document.createElement("div");
            noResults.className = "search-no-results";
            noResults.innerText = "No matching workflows found";
            resultsDropdown.appendChild(noResults);
        }

        resultsDropdown.style.display = "block";
    });

    // Close dropdown instantly if the user clicks anywhere outside the input box area
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
            resultsDropdown.style.display = "none";
        }
    });
});
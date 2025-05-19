document.addEventListener("DOMContentLoaded", function () {
  const pageHeader = document.getElementById("pageHeader");
  const headerHeight = pageHeader?.offsetHeight || 70; // Default to 70 if header isn't found immediately

  // --- Smooth Scroll for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const hash = this.hash;
      if (hash) {
        const targetElement = document.querySelector(hash);
        if (targetElement) {
          e.preventDefault();
          const elementPosition = targetElement.offsetTop;
          window.scrollTo({
            top: elementPosition - headerHeight + 1, // +1 to ensure it's clearly below the sticky header
            behavior: "smooth",
          });
        }
      }
    });
  });

  // --- Intersection Observers for Animations & Active Nav ---
  const sections = document.querySelectorAll(
    "section.main-content-section[id]"
  );
  const navLinks = document.querySelectorAll(".site-main-navigation a");
  const portfolioCards = document.querySelectorAll(".portfolio-item-card");

  // Options for section observer (for nav highlighting and section fade-in)
  // rootMargin: top offset by header, bottom offset to trigger earlier/later
  const sectionObserverOptions = {
    root: null,
    rootMargin: `-${headerHeight + 60}px 0px -40% 0px`, // Adjusted bottom margin for earlier nav change
    threshold: 0.01, // Trigger as soon as a tiny part is visible considering rootMargin
  };

  // Options for card observer (for portfolio card fade-in)
  const cardObserverOptions = {
    root: null,
    rootMargin: "0px 0px -50px 0px", // Trigger when card is 50px from bottom of viewport
    threshold: 0.1, // At least 10% of the card is visible
  };

  const sectionScrollObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        const targetId = entry.target.getAttribute("id");
        if (entry.isIntersecting) {
          entry.target.classList.add("visible-in-viewport");

          // Update nav active state
          navLinks.forEach((link) => {
            link.classList.remove("current-section-link");
            if (link.getAttribute("href") === `#${targetId}`) {
              link.classList.add("current-section-link");
            }
          });
        } else {
          // Optional: remove 'visible-in-viewport' if you want animation on each scroll in/out
          // entry.target.classList.remove('visible-in-viewport');
        }
      });
    },
    sectionObserverOptions
  );

  sections.forEach((section) => {
    if (section) sectionScrollObserver.observe(section);
  });

  const cardScrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible-in-viewport");
        observer.unobserve(entry.target); // Animate card once
      }
    });
  }, cardObserverOptions);

  portfolioCards.forEach((card) => {
    if (card) cardScrollObserver.observe(card);
  });

  // --- Header Scroll Shadow Effect ---
  function handleHeaderEffect() {
    if (pageHeader) {
      // Ensure header exists
      if (window.scrollY > 10) {
        pageHeader.classList.add("scrolled-past-hero");
      } else {
        pageHeader.classList.remove("scrolled-past-hero");
      }
    }
  }
  window.addEventListener("scroll", handleHeaderEffect);
  handleHeaderEffect(); // Initial check on load

  // --- Initial Nav Active State on Load ---
  function setInitialNavState() {
    let currentActiveFound = false;
    const firstSection = sections[0];

    // Check if scroll position is before the first section
    if (
      firstSection &&
      window.scrollY < firstSection.offsetTop - headerHeight - 10 &&
      navLinks.length > 0
    ) {
      navLinks.forEach((link) => link.classList.remove("current-section-link"));
      if (navLinks[0].getAttribute("href") === `#${firstSection.id}`) {
        navLinks[0].classList.add("current-section-link");
      } else {
        // Fallback if first link isn't #introduction-area for some reason
        navLinks[0].classList.add("current-section-link");
      }
      currentActiveFound = true;
    } else {
      // Iterate sections to find the one currently in view near the top
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const rect = section.getBoundingClientRect();
        // Check if the top of the section is within a range below the header
        // This range (e.g., headerHeight + 150) helps catch sections that are partially visible at the top
        if (rect.top >= 0 && rect.top < headerHeight + 150) {
          navLinks.forEach((link) => {
            link.classList.remove("current-section-link");
            if (link.getAttribute("href") === `#${section.id}`) {
              link.classList.add("current-section-link");
              currentActiveFound = true;
            }
          });
          if (currentActiveFound) break; // Stop if found
        }
      }
    }

    // If no section is actively "at the top" (e.g., scrolled far down, or page is very short)
    // and a section is marked visible by observer, ensure its nav is active.
    // This handles cases where the scroll lands such that no section is perfectly at the "top" per above logic.
    if (!currentActiveFound) {
      const visibleSection = Array.from(sections).find((s) =>
        s.classList.contains("visible-in-viewport")
      );
      if (visibleSection) {
        navLinks.forEach((link) => {
          link.classList.remove("current-section-link");
          if (link.getAttribute("href") === `#${visibleSection.id}`) {
            link.classList.add("current-section-link");
          }
        });
      } else if (
        navLinks.length > 0 &&
        !Array.from(navLinks).some((l) =>
          l.classList.contains("current-section-link")
        )
      ) {
        // Default to the first nav link if nothing else is set and if page just loaded near top
        if (window.scrollY < (sections[0]?.offsetTop || 200)) {
          // Small threshold from top
          navLinks[0].classList.add("current-section-link");
        }
      }
    }
  }

  // Use a timeout to allow layout and observers to potentially fire once
  setTimeout(setInitialNavState, 150);

  // Re-evaluate active nav link on scroll end for better accuracy if needed
  let scrollTimeout;
  window.addEventListener(
    "scroll",
    () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(setInitialNavState, 150); // Adjust timeout as needed
    },
    { passive: true }
  );
});

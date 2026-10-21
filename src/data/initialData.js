// Dynamic initial state definitions for QuickHedge.
// All live content is populated dynamically from Supabase:
// - Videos: public.site_videos table
// - Team: public.team_members table
// - CTAs: public.site_ctas table
// - Settings: public.app_settings table

export const initialVideos = [];

export const executiveLeader = null;

export const teamMembers = [];

export const initialSiteCtas = {
  enabled: true,
  items: []
};

export const initialSettings = {
  fundingOpen: false,
  websiteName: "QuickHedge Inc.",
  tagline: "Premier Physical Education, Human Kinetics & Sports Science Platform",
  subheadline: "QuickHedge Inc. empowers physical education scholars, athletic coaches, and movement scientists with verified curriculum study materials and assessments",
  ticketPriceNgn: 5000,
  eventDate: "2026 Academic Session",
  eventLocation: "Asaba, Delta State, Nigeria & Online Academic Portal",
  hqLabel: "Academic Directorate",
  socialLinks: {
    instagram: "https://instagram.com/quickhedge",
    tiktok: "https://tiktok.com/@quickhedge",
    facebook: "https://facebook.com/share/quickhedge",
    x: "https://x.com/quickhedge",
    linkedin: "https://linkedin.com/company/quickhedge",
    youtube: "https://youtube.com/@quickhedge",
    whatsapp: "https://whatsapp.com/channel/0029VbBRZAfKgsNpCyJY9I3B"
  },
  contact: {
    phone: "+234 803 893 3808",
    email: "contact@quick-hedgeconsulting.com",
    addressLines: [
      "Suite 202,",
      "No 113 Okpanam Road,",
      "Opposite NNPC Filling Station",
      "Asaba, Delta State, Nigeria."
    ]
  }
};

// Live database collections (purged all mock/dummy data)
export const sampleApplications = [];
export const samplePartnerships = [];

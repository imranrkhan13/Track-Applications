# 🌳 Career Garden

A beautiful, nature-themed job application tracker that helps you nurture your career growth. Watch your job applications grow from seeds 🌱 to full trees 🌳!

![Career Garden](https://img.shields.io/badge/React-18.x-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Status](https://img.shields.io/badge/status-active-success)

## 💭 Design Philosophy

This project started from a simple sketch on paper - a vision of making job hunting less stressful and more visual. I wanted to create something that felt alive, where each application wasn't just data in a table, but a living thing you're nurturing.

The garden metaphor came naturally: you plant seeds (apply), they sprout (interviews), and with care, they bloom into something beautiful (offers). Even the ones that don't make it (rejections) have their place in the garden as fallen leaves - reminders that growth isn't always linear.

I designed the user flow to be intuitive: starting from an empty garden, adding your first seed, watching sections organize themselves automatically, and celebrating each stage of growth. The UI is deliberately minimal - no unnecessary clutter, just you and your growing career garden.

## ✨ Features

### 🎨 Beautiful Garden Theme
- **Seedling (Applied)** 🌱 - Just planted your application
- **Sprouting (Interview)** 🌿 - Growing and progressing
- **Bloomed (Accepted)** 🌳 - Success! Your tree is fully grown
- **Withered (Rejected)** 🍂 - Didn't make it this time

### 🔐 Secure Authentication
- Google OAuth 2.0 integration
- Personalized greetings with user's first name
- Session persistence across visits

### 📊 Smart Organization
- Automatically categorized by status
- Sortable by date
- Expandable sections for better view
- Mobile-responsive grid layout

### 💾 Data Persistence
- LocalStorage for reliable data saving
- User-specific job tracking
- Edit and delete functionality
- Optional notes for each application

### 📱 Fully Responsive
- Works seamlessly on mobile, tablet, and desktop
- Touch-friendly interface
- Adaptive grid (2 columns mobile → 5 columns desktop)

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Project with OAuth 2.0 credentials

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/career-garden.git
cd career-garden
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Install required packages**
```bash
npm install @react-oauth/google jwt-decode
```

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized origins (e.g., `http://localhost:5173`)
   - Copy your Client ID

5. **Configure the app**

Open `src/main.jsx` and wrap your App with GoogleOAuthProvider:

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID_HERE">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
```

6. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

7. **Open your browser**
Navigate to `http://localhost:5173`

## 🎯 Usage

### Adding a Job Application
1. Click the floating 🌱 button (bottom-right)
2. Fill in the form:
   - **Company** (required)
   - **Role** (required)
   - **Growth Stage** (Applied/Interview/Rejected/Accepted)
   - **Date Planted** (required)
   - **Garden Notes** (optional)
3. Click "🌱 Plant" to save

### Managing Applications
- **Edit**: Click "✏️ Tend" on any card
- **Delete**: Click "🗑️" on any card
- **View All**: Click "View all" when section has 5+ items
- **Sign Out**: Click "Sign out" button in header

### Understanding the Garden
- **Applied** 🌱: Recently submitted applications
- **Interview** 🌿: Applications in interview stage
- **Accepted** 🌳: Successful applications
- **Rejected** 🍂: Unsuccessful applications

## 🗺️ User Flow & Architecture

I mapped out the entire user experience before writing a single line of code. Here's the journey:

```
┌─────────────────────────────────────────────────────────────┐
│                     EMPTY GARDEN STATE                       │
│  Simple, centered "Plant Your First Seed" button            │
│  Clean landing - no overwhelming UI                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    [User clicks Add button]
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     MODAL FORM APPEARS                       │
│  Backdrop blur for focus                                     │
│  Garden-themed inputs with emoji labels                      │
│  Minimal fields - just what matters                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
                   [User plants their seed]
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   GARDEN VIEW ACTIVATED                      │
│                                                               │
│  ┌─────────────────────────────────────┐                    │
│  │  Hello, [Name] 👋                    │  [Sign out]       │
│  │  Your garden has X trees             │                   │
│  └─────────────────────────────────────┘                    │
│                                                               │
│  🌱 Applied (4)                          [View all →]        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │  🌱  │ │  🌱  │ │  🌱  │ │  🌱  │                       │
│  │ Card │ │ Card │ │ Card │ │ Card │                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                               │
│  🌿 Interview (2)                        [View all →]        │
│  ┌──────┐ ┌──────┐                                          │
│  │  🌿  │ │  🌿  │                                          │
│  │ Card │ │ Card │                                          │
│  └──────┘ └──────┘                                          │
│                                                               │
│  🌳 Accepted (1)                                             │
│  ┌──────┐                                                    │
│  │  🌳  │                                                    │
│  │ Card │                                                    │
│  └──────┘                                                    │
│                                                               │
│                                        [🌱 Floating button]  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**1. Empty State First**
Instead of showing an empty table or complex UI, I show a single inviting button. First impressions matter - the app should feel approachable, not overwhelming.

**2. Floating Action Button**
The persistent 🌱 button stays with you as you scroll. It's always there when inspiration strikes to add another application.

**3. Auto-Categorization**
Jobs automatically sort themselves into sections. No manual organization needed - the app understands your workflow.

**4. Progressive Disclosure**
Only show "View all" when there are 5+ items in a section. The UI adapts to your data, not the other way around.

**5. Responsive Grid**
- **Mobile**: 2 columns (easy thumb reach)
- **Tablet**: 3 columns (balanced view)
- **Desktop**: 5 columns (maximize space)

**6. Edit in Place**
Clicking "Tend" opens the same form you used to create - consistency reduces cognitive load.

## 🛠️ Tech Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Google OAuth** - Authentication
- **LocalStorage** - Data persistence

## 📁 Project Structure

```
career-garden/
├── src/
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/
├── package.json
└── README.md
```

## 🎨 Components

### Main Components
- **EmptyState** - Welcome screen when no jobs added
- **LoginScreen** - Google OAuth login page
- **JobCard** - Individual job application card
- **JobSection** - Categorized job sections
- **JobModal** - Add/Edit job form

### Key Features
- Responsive design with Tailwind CSS
- Animated transitions and hover effects
- Form validation
- Confirm dialogs for destructive actions

## 🔒 Data Storage

Jobs are stored in browser's localStorage:
- **Key format**: `career_garden_jobs_{userId}`
- **Data structure**: Array of job objects
- **User session**: `career_garden_user`

### Job Object Schema
```javascript
{
  id: number,
  company: string,
  role: string,
  status: "Applied" | "Interview" | "Rejected" | "Accepted",
  date: string (YYYY-MM-DD),
  notes?: string
}
```

## 🚧 Known Limitations

- Data stored locally (no cloud sync)
- Single user per browser
- No export/import functionality (yet!)
- Browser storage size limits (~5-10MB)

## 🔮 Future Enhancements

These are features I've sketched out but haven't implemented yet:

- [ ] **Cloud Sync** - Firebase/Supabase integration for cross-device access
- [ ] **Export Tools** - Download your garden as CSV/PDF
- [ ] **Analytics Dashboard** - Visualize your job search journey
- [ ] **Smart Reminders** - Email notifications for follow-ups
- [ ] **Timeline View** - See your applications on a calendar
- [ ] **Dark Mode** - For late-night application sessions
- [ ] **Company Intel** - Integrated research and notes
- [ ] **Interview Prep** - Built-in preparation checklists
- [ ] **Garden Themes** - Customize your garden aesthetic

## 🎨 Design System

I kept the design system deliberately simple:

**Colors**
- Primary: Emerald (`emerald-600`, `emerald-700`)
- Backgrounds: Soft green gradients (`green-50`, `emerald-50`, `teal-50`)
- Status colors: Semantic (green for growth, amber for progress, gray for neutral)

**Typography**
- Headers: Light weight for elegance
- Body: Medium weight for readability
- Monospace: For data/dates

**Spacing**
- Cards: Compact but breathable (`p-3` to `p-4`)
- Sections: Clear separation (`mb-8` to `mb-10`)
- Responsive: Adapts padding based on screen size

**Animation**
- Subtle: Hover effects and transitions
- Purposeful: Bounce on empty state to draw attention
- Performant: CSS transforms, not layout changes

## 🤝 Contributing

Contributions are welcome! I'd love to see what you'd add to the garden.

### How to Contribute

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Ideas for Contributors
- Add new garden themes (cherry blossoms, autumn, winter?)
- Implement dark mode
- Create data visualization features
- Add accessibility improvements
- Write tests
- Improve mobile experience

## 🙏 Acknowledgments

This project was born from personal experience - the frustration of tracking job applications in spreadsheets, the anxiety of not knowing where things stood, and the desire to make the process feel more human.

Thanks to:
- Everyone who's ever struggled with job hunting
- The React community for amazing tools
- Nature, for the perfect metaphor
- Coffee ☕, for keeping the coding sessions going

## 📝 Lessons Learned

Building this taught me:

1. **Metaphors Matter** - The garden theme isn't just decorative; it reframes job hunting as growth
2. **Start Simple** - The MVP was just cards and a form. Everything else came later
3. **Design for Emotion** - Job hunting is stressful; the UI should be calming
4. **State Management** - LocalStorage + React state is enough for many apps
5. **Responsive is Essential** - Most job seekers are on their phones

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgments

- Inspired by the growth metaphor of gardening
- Built with love for job seekers everywhere
- Special thanks to the React and Tailwind communities

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/career-garden](https://github.com/yourusername/career-garden)

---

**Made with 💚 and 🌱 - Happy Job Hunting!**
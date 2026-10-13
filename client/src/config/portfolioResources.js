export const RESOURCES = [
  {
    resource: 'hero',
    label: 'Hero',
    labelPlural: 'Heroes',
    description: 'Hero bio and buttons - name, headline, photo, socials and résumé come from the Profile tab',
    columns: [
      { accessorKey: 'primaryButtonText', header: 'Primary button' },
      { accessorKey: 'secondaryButtonText', header: 'Secondary button' },
      { accessorKey: 'published', header: 'Published', render: 'bool' },
      { accessorKey: 'sortOrder', header: 'Order' },
      { accessorKey: 'updatedAt', header: 'Updated', render: 'date' }
    ],
    fields: [
      { name: 'heroBio', label: 'Hero bio', type: 'textarea', hint: 'Shown in the hero instead of the profile bio' },
      { name: 'primaryButtonText', label: 'Primary button text', type: 'text' },
      { name: 'primaryButtonUrl', label: 'Primary button target', type: 'select', options: ['home', 'experience', 'projects', 'about', 'skills', 'certificates', 'github', 'testimonials', 'contact'] },
      { name: 'secondaryButtonText', label: 'Secondary button text', type: 'text' },
      { name: 'secondaryButtonUrl', label: 'Secondary button target', type: 'select', options: ['home', 'experience', 'projects', 'about', 'skills', 'certificates', 'github', 'testimonials', 'contact'] },
      { name: 'published', label: 'Published', type: 'checkbox' },
      { name: 'sortOrder', label: 'Sort order', type: 'number', hint: 'Lower shows first' }
    ]
  },
  {
    resource: 'experience',
    label: 'Experience',
    labelPlural: 'Experiences',
    description: 'Work history timeline',
    columns: [
      { accessorKey: 'role', header: 'Role' },
      { accessorKey: 'company', header: 'Company' },
      { accessorKey: 'startDate', header: 'Start', render: 'date' },
      { accessorKey: 'endDate', header: 'End', render: 'date', fallback: 'Present (current)' },
      { accessorKey: 'current', header: 'Current', render: 'bool' },
      { accessorKey: 'sortOrder', header: 'Order' }
    ],
    fields: [
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', label: 'End date', type: 'date', hint: 'Leave empty when current' },
      { name: 'current', label: 'Currently working here', type: 'checkbox' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'sortOrder', label: 'Sort order', type: 'number', hint: 'Lower shows first' }
    ]
  },
  {
    resource: 'project',
    label: 'Project',
    labelPlural: 'Projects',
    description: 'Published projects shown on the site',
    columns: [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'featured', header: 'Featured', render: 'bool' },
      { accessorKey: 'published', header: 'Published', render: 'bool' },
      { accessorKey: 'sortOrder', header: 'Order' }
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug (optional)', type: 'text', hint: 'Auto-formatted to lowercase-dashes' },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'techStack', label: 'Tech stack', type: 'list', hint: 'One technology per line' },
      { name: 'repoUrl', label: 'Repository URL', type: 'url', hint: 'Bare domains are fine - https:// is added automatically' },
      { name: 'demoUrl', label: 'Demo URL', type: 'url' },
      { name: 'imageUrl', label: 'Cover image', type: 'upload', uploadKind: 'image', hint: 'Uploaded to storage (Cloudflare R2)' },
      { name: 'videoUrl', label: 'Video teaser', type: 'upload', uploadKind: 'video', hint: 'Short MP4, WebM or MOV clip up to 25MB' },
      { name: 'featured', label: 'Featured project', type: 'checkbox' },
      { name: 'published', label: 'Published (visible on site)', type: 'checkbox' },
      { name: 'sortOrder', label: 'Sort order', type: 'number', hint: 'Lower shows first' }
    ]
  },
  {
    resource: 'profile',
    label: 'Profile',
    labelPlural: 'Profiles',
    description: 'Hero, bio, photo, resume link and socials',
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'headline', header: 'Headline' },
      { accessorKey: 'updatedAt', header: 'Updated', render: 'date' }
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'headline', label: 'Headline', type: 'text', required: true },
      { name: 'bio', label: 'Bio', type: 'textarea', required: true },
      { name: 'avatarUrl', label: 'Avatar', type: 'upload', uploadKind: 'image', hint: 'Up to 20MB - stored in Cloudflare R2' },
      { name: 'resumeUrl', label: 'Résumé', type: 'upload', uploadKind: 'document', hint: 'PDF, DOC or DOCX - stored in Cloudflare R2' },
      { name: 'status', label: 'Status', type: 'text', hint: 'e.g. Open to opportunities' },
      { name: 'myLocation', label: 'Location', type: 'text' },
      { name: 'myDegree', label: 'Degree', type: 'text' },
      { name: 'myDegreeDetails', label: 'Degree details', type: 'textarea' },
      { name: 'socials', label: 'Socials', type: 'json', hint: '{"github": "...", "linkedin": "...", "email": "..."}' },
      { name: 'meta', label: 'SEO meta', type: 'json', hint: '{"title": "...", "description": "..."}' }
    ],
    canCreate: true,
    canDelete: false
  },
  {
    resource: 'skill',
    label: 'Skill',
    labelPlural: 'Skills',
    description: 'Hard skills (with logos) and soft skills, grouped by category',
    columns: [
      { accessorKey: 'logoUrl', header: 'Logo', render: 'image' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'type', header: 'Type', render: 'badge', badgeTone: { hard: 'green', soft: 'amber' } },
      { accessorKey: 'category', header: 'Category', render: 'badge' },
      { accessorKey: 'sortOrder', header: 'Order' }
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['hard', 'soft'], hint: 'Hard skills show a logo; soft skills render as chips' },
      { name: 'category', label: 'Category', type: 'text', hint: 'e.g. Languages, AI tools, Frameworks. Defaults to "Other"' },
      { name: 'icon', label: 'Logo icon', type: 'text', hint: 'Simple Icons slug, e.g. python, openai, docker (logo at cdn.simpleicons.org)' },
      { name: 'logoUrl', label: 'Custom logo', type: 'upload', uploadKind: 'image', hint: 'Optional image - overrides the icon slug above' },
      { name: 'keywords', label: 'Keywords', type: 'list', hint: 'One keyword per line' },
      { name: 'sortOrder', label: 'Sort order', type: 'number', hint: 'Lower shows first' }
    ]
  },
  {
    resource: 'certificate',
    label: 'Certificate',
    labelPlural: 'Certificates',
    description: 'Credentials and certifications',
    columns: [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'issuer', header: 'Issuer' },
      { accessorKey: 'issuedAt', header: 'Issued', render: 'date' }
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'issuer', label: 'Issuer', type: 'text', required: true },
      { name: 'issuedAt', label: 'Issue date', type: 'date', required: true },
      { name: 'credentialUrl', label: 'Credential URL', type: 'url' },
      { name: 'imageUrl', label: 'Image URL', type: 'url' },
      { name: 'sortOrder', label: 'Sort order', type: 'number', hint: 'Lower shows first' }
    ]
  },
  {
    resource: 'github',
    label: 'GitHub repo',
    labelPlural: 'GitHub repos',
    description: 'Repositories highlighted on the site',
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'language', header: 'Language', render: 'badge' },
      { accessorKey: 'stars', header: 'Stars' },
      { accessorKey: 'sortOrder', header: 'Order' }
    ],
    fields: [
      { name: 'name', label: 'Repository name', type: 'text', required: true },
      { name: 'url', label: 'Repository URL', type: 'url', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'language', label: 'Primary language', type: 'text' },
      { name: 'stars', label: 'Stars', type: 'number' },
      { name: 'topics', label: 'Topics', type: 'list', hint: 'One topic per line' },
      { name: 'sortOrder', label: 'Sort order', type: 'number', hint: 'Lower shows first' }
    ]
  },
  {
    resource: 'testimonial',
    label: 'Testimonial',
    labelPlural: 'Testimonials',
    description: 'Quotes from clients and colleagues',
    columns: [
      { accessorKey: 'author', header: 'Author' },
      { accessorKey: 'role', header: 'Role' },
      { accessorKey: 'sortOrder', header: 'Order' }
    ],
    fields: [
      { name: 'author', label: 'Author', type: 'text', required: true },
      { name: 'role', label: 'Role / company', type: 'text' },
      { name: 'quote', label: 'Quote', type: 'textarea', required: true },
      { name: 'avatarUrl', label: 'Avatar URL', type: 'url' },
      { name: 'sortOrder', label: 'Sort order', type: 'number', hint: 'Lower shows first' }
    ]
  },
  {
    resource: 'contact',
    label: 'Contact message',
    labelPlural: 'Contact messages',
    description: 'Inbox from the public contact form',
    canCreate: false,
    canDelete: true,
    readOnlyFields: ['name', 'email', 'subject', 'message'],
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'subject', header: 'Subject' },
      { accessorKey: 'status', header: 'Status', render: 'badge', badgeTone: { NEW: 'amber', REPLIED: 'green', ARCHIVED: 'gray' } },
      { accessorKey: 'createdAt', header: 'Received', render: 'date' }
    ],
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: ['NEW', 'REPLIED', 'ARCHIVED'] },
      { name: 'repliedAt', label: 'Replied at', type: 'date', hint: 'Optional timestamp' }
    ]
  }
];

export function findResourceConfig(name) {
  return RESOURCES.find((config) => config.resource === name);
}
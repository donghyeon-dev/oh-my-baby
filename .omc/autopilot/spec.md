# Phase 4: Media Gallery & Download - Technical Specification

## Overview
Implement the media viewing and download functionality for the Oh My Baby family media sharing platform.

## Functional Requirements

### 1. Gallery View
- Display uploaded media in a responsive grid layout
- Group media by date (using EXIF takenAt or createdAt)
- Filter by media type (All/Photos/Videos)
- Support infinite scroll for pagination
- Show loading states during data fetch

### 2. Photo Viewer
- Full-screen modal/lightbox for viewing photos
- Zoom in/out functionality (buttons or gestures)
- Navigate between photos (prev/next)
- Display photo metadata (date, uploader, size)
- Close via button or backdrop click

### 3. Video Player
- HTML5 video with native controls
- Support for MP4, MOV, AVI, WebM formats
- Display video duration and metadata
- Fullscreen support
- Loading state during buffer

### 4. Download Functionality
- Single file download via presigned URL
- Multi-select mode for batch download
- Sequential download with progress (1/N, 2/N)
- Direct download to device (no ZIP)

## Technical Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Components: shadcn/ui patterns
- State: React hooks (no new Zustand store needed)
- API: Existing mediaService functions

## Architecture

### Components
```
frontend/src/components/media/
├── MediaGrid.tsx        # Responsive grid with infinite scroll
├── MediaCard.tsx        # Individual media thumbnail
├── MediaViewer.tsx      # Photo/Video viewer modal
├── DateHeader.tsx       # Date section divider
└── DownloadButton.tsx   # Download handler
```

### Page Structure
```
frontend/src/app/(main)/gallery/
└── page.tsx            # Gallery page with filters
```

## Implementation Plan

### Task 1: MediaCard Component
- Thumbnail display with aspect ratio preservation
- Type indicator (photo/video icon)
- Click handler for opening viewer
- Selection checkbox for batch mode

### Task 2: DateHeader Component
- Date divider with formatted date
- Media count for that date

### Task 3: MediaGrid Component
- Responsive grid (1-4 columns based on screen)
- Date grouping with DateHeader
- Infinite scroll with IntersectionObserver
- Loading skeleton during fetch

### Task 4: MediaViewer Component
- Modal overlay with backdrop
- Photo view with zoom controls
- Video view with HTML5 player
- Navigation between media
- Metadata display
- Download button

### Task 5: Gallery Page
- Type filter tabs (All/Photos/Videos)
- Media grid integration
- Viewer modal state
- Multi-select mode toggle
- Batch download functionality

### Task 6: Unit Tests
- MediaCard component tests
- MediaViewer component tests
- MediaGrid functionality tests

## API Endpoints (Already Implemented)
- `GET /api/media` - List with pagination
- `GET /api/media/:id` - Get detail
- `GET /api/media/:id/download` - Get presigned URL
- `GET /api/media/dates` - Get distinct dates

## File Size Estimates
- MediaCard.tsx: ~80 lines
- DateHeader.tsx: ~30 lines
- MediaGrid.tsx: ~150 lines
- MediaViewer.tsx: ~250 lines
- gallery/page.tsx: ~200 lines
- Tests: ~300 lines total

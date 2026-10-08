We need the base Chrome components that frame every editor screen-the top nav bar and the left sidebar shell. This will be reused and extended in every chapter that follows.

### Editor Navbar

Create 'components/editor/editor-navbar.tsx'.

Requirments

-Fixed-height top navbar
-Left, center, and right sections
-Left section contains sidebar toggle button
-Use 'panelleftopen'/'panelleftclose' icons based on sidebar state
-Right section stays empty for now
-Dark background with subtle button border

### Project SideBar

Create 'components/editor/project-sidebar.tsx'.

Requirments

-Sidebar should float above the editor canvas.
-Opening it should not push page content.
-Slides in from the left.
-accepts `is-open`  and 'onClose' prop.
-Header with 'Projects' title + close button.
- shadcn 'Tabs':
-My projects
-shared.
-Both tabs shows empty placeholder state.
-Full width 'New Project' button at the bottom with 'Plus' icon.

### Dialog Pattern 

Use the existing color tokens from 'global.css' for dialog styling.

Support:

-title
-description
-footer actions

Do not build actual dialogs yet.

### Check when done

-new components compile without TypeScript errors
-no lint errors
-dialog pattern is ready for future use
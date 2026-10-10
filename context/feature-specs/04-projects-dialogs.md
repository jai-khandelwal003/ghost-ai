## Goal

Build the '/editor' home screen and add project dialogs/sidebar actions. No api calls or persistence yet.

## Editor home

Reuse the existing editor layout. Do not modify the navbar or sidebar behavior. 

In the center of the page, add:


-Heading: 'Create a project or open an existing one.'
-Description: 'Start a new architecture workspace or choose a project from the sidebar.'
-'New project' button with a 'plus' icon.


Keep the layout minimal. Do not wrap this content in cards.

Clicking 'New Project' should open the Create Project dialog.

## Dialogs

### Create project

-Project name input
-lives slug review based on the name
-preview update as the user types.

## Rename Project

-prefilled project name input
-current project name shown in the description 
-input auto-focuses
-Enter submits

## Delete Project 

-destructive confirmation only
-no input
-confirm button uses destructive styling

## Sidebar

Add project item actions:

-rename
-delete

Show actions only for owned projects.

Hide actions for shared/collabrator projects.

On mobiles:
-tapping outside the sidebar closes it
-add a backdrop scrim

## Implementation 

Create a Dedicated hook to manage:

-dialog state
-form state
-loading state

Wire:

-editor home 'New Project' - Create Dialog
-sidebar create - Create Dialog
-sidebar rename - Rename Dialog
-sidebar delete - Delete dialog

Use mock project data only, Do not add api calls or persistence 

## Check When dDne

-sidebar actions are wired
-slug preview works 
-no Typescript errors
-no lint errors


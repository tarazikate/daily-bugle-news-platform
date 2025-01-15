// URLs for different backend microservices
const USER_SERVICE_URL = 'http://user_service:3001';
const STORY_SERVICE_URL = 'http://story_service:3002';
const COMMENT_SERVICE_URL = 'http://comment_service:3003';
const AD_SERVICE_URL = 'http://ad_service:3004';

let currentUser = null; // Stores the currently logged-in user

// Safely gets an element by its ID
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with id "${id}" not found.`);
    }
    return element;
}

// Handles user registration
getElement('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = getElement('registerUsername').value;
    const password = getElement('registerPassword').value;
    const role = getElement('registerRole').value;

    const response = await fetch(`${USER_SERVICE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
    });

    const data = await response.json();
    alert(data.message || 'Registered successfully!');
});

// Handles user login
getElement('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = getElement('loginUsername').value;
    const password = getElement('loginPassword').value;

    const response = await fetch(`${USER_SERVICE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
    });

    const data = await response.json();

    if (response.ok) {
        alert('Login successful!');
        currentUser = { username, role: data.role };
        getElement('registerSection').style.display = 'none';
        getElement('loginSection').style.display = 'none';
        getElement('logoutSection').style.display = 'block';
        getElement('mainTitle').textContent = 'All Stories';

        if (data.role === 'reader') {
            getElement('readerView').style.display = 'block';
            getElement('adImage').src = `${AD_SERVICE_URL}/static/ad_image.jpg`;
        } else if (data.role === 'author') {
            getElement('authorView').style.display = 'block';
        }
        loadSingleStory();
    } else {
        alert(data.message || 'Login failed.');
    }
});

// Allows an author to create a story
getElement('createStory').addEventListener('click', async () => {
    const title = getElement('newStoryTitle').value.trim();
    const body = getElement('newStoryBody').value.trim();

    if (!title || !body) {
        alert('Both the title and body of the story must be filled out.');
        return;
    }

    const response = await fetch(`${STORY_SERVICE_URL}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
        credentials: 'include',
    });

    const data = await response.json();
    alert(data.message || 'Story created successfully!');
    loadSingleStory(data.storyId || null);
});

// Adds a comment to a story
getElement('submitComment').addEventListener('click', async () => {
    const commentText = getElement('newCommentText').value.trim();
    const storyId = getElement('currentStoryId').value;

    if (!commentText) {
        alert('Comment text cannot be empty.');
        return;
    }

    try {
        const response = await fetch(`${COMMENT_SERVICE_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ storyId, text: commentText }),
        });

        if (!response.ok) {
            console.error('Failed to post comment:', await response.text());
            return;
        }

        alert('Comment added successfully!');
        getElement('newCommentText').value = '';
        loadSingleStory(storyId);
    } catch (err) {
        console.error('Error posting comment:', err);
    }
});


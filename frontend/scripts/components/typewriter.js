/**
 * Typewriter effect — letter-by-letter text reveal.
 * Pure function: takes a container, text, and speed. Returns a Promise.
 */

export function typewrite(container, text, speed = 30) {
    return new Promise((resolve) => {
        const cursor = document.createElement("span");
        cursor.classList.add("typewriter-cursor");
        container.appendChild(cursor);

        let i = 0;
        const chatMessages = document.getElementById("chat-messages");

        const interval = setInterval(() => {
            if (i < text.length) {
                container.insertBefore(document.createTextNode(text[i]), cursor);
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                clearInterval(interval);
                cursor.remove();
                resolve();
            }
        }, speed);
    });
}

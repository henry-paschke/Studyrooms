export function stringToColor(email : string) {
    // Step 1: Hash the email
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = (hash << 5) - hash + email.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    
    // Step 2: Convert hash to RGB values (using bitwise operations)
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;
    
    // Step 3: Adjust the color to make it pastel
    // Pastel colors are light, so we blend the original color with white.
    const pastelR = Math.min(255, r*0.7); // Increase red component
    const pastelG = Math.min(255, g); // Increase green component
    const pastelB = Math.min(255, b); // Increase blue component
    
    // Return the pastel RGB color as a string
    return `rgb(${pastelR}, ${pastelG}, ${pastelB})`;
}
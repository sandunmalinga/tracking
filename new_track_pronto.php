<?php
// Set header to JSON to indicate that the response is JSON
header('Content-Type: application/json');

// Initialize the tracking number variable
$trackingNumber = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['trackingNumber'])) {
    // Get tracking number from POST request
    $trackingNumber = htmlspecialchars($_POST['trackingNumber']);
} elseif ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_GET['trackingNumber'])) {
    // Get tracking number from GET request
    $trackingNumber = htmlspecialchars($_GET['trackingNumber']);
} else {
    // Return an error response in JSON format
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

// Call the Node.js Puppeteer script to get tracking details
$trackingNumberEscaped = escapeshellarg($trackingNumber);
$output = shell_exec("node track_pronto.js $trackingNumberEscaped");

// Check if shell_exec returned any output
if ($output === null || $output === '') {
    echo json_encode(['success' => false, 'message' => 'No output from tracking script.']);
} else {
    // Parse the JSON response from the Node.js script
    $result = json_decode($output, true);

    // Check if the JSON was parsed correctly
    if ($result === null) {
        echo json_encode(['success' => false, 'message' => 'Failed to parse JSON.', 'raw_output' => $output]);
    } else {
        // Return the result as JSON
        echo json_encode($result);
    }
}
?>

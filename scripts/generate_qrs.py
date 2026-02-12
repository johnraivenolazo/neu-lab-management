import qrcode
import os
import sys

# Define the list of rooms to generate QR codes for
rooms = [
    "ComLab 1",
    "ComLab 2",
    "Multimedia Lab",
    "Network Lab",
    "Hardware Lab",
]

# Path to the public folder where we will save the images
output_dir = os.path.join(os.getcwd(), 'public', 'qr-codes')
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"Generating QR Codes in: {output_dir}")

for room in rooms:
    print(f"Generating QR for: {room}")
    
    # Create the QR code instance
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    # Add room name as the data
    qr.add_data(room)
    qr.make(fit=True)
    
    # Create the image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save the image
    filename = f"qr-{room.replace(' ', '-').lower()}.png"
    filepath = os.path.join(output_dir, filename)
    img.save(filepath)
    print(f"Saved to {filepath}")

print("Successfully generated all QR codes.")

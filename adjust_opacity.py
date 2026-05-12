from PIL import Image
import sys

def apply_opacity(input_path, output_path, opacity_factor):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    for item in data:
        # item is (R, G, B, A)
        new_a = int(item[3] * opacity_factor)
        new_data.append((item[0], item[1], item[2], new_a))

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved {output_path} with {opacity_factor*100}% opacity.")

if __name__ == "__main__":
    apply_opacity(sys.argv[1], sys.argv[2], float(sys.argv[3]))

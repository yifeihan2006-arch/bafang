"""Copy the published hotel media into the static Pages build."""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from pathlib import Path
from subprocess import check_output


MEDIA_ORIGIN = 'https://resonance-house-vienna.igort0hhodi.chatgpt.site/assets/'
HOTEL_PATH = Path('resonance-house-vienna')


def install_hotel_media(output_directory):
    hotel = output_directory / HOTEL_PATH
    manifest = hotel / 'asset-checksums.txt'
    entries = [line.split() for line in manifest.read_text().splitlines()]
    target = hotel / 'assets'
    target.mkdir(exist_ok=True)

    def fetch_asset(entry):
        expected, filename = entry
        data = check_output(['curl', '--fail', '--silent', '--show-error', '--location',
                             '--retry', '3', '--max-time', '30', MEDIA_ORIGIN + filename])
        if sha256(data).hexdigest() != expected:
            raise ValueError(f'Unexpected hotel media content: {filename}')
        (target / filename).write_bytes(data)

    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(fetch_asset, entries))
    manifest.unlink()


if __name__ == '__main__':
    install_hotel_media(Path('public'))

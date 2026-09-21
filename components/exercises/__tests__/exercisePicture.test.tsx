import { Image, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { ExercisePicture } from '../exercisePicture';

function mockImageSize(width: number, height: number) {
  jest.spyOn(Image, 'getSize').mockImplementation(((_uri: string, success: (w: number, h: number) => void) => {
    success(width, height);
  }) as never);
}

// The rendered image, as plain JSON.
function frameOf(screen: Awaited<ReturnType<typeof render>>) {
  return JSON.parse(JSON.stringify(screen.toJSON()));
}

describe('ExercisePicture', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the picture whole — contained in its frame, never cropped to it', async () => {
    mockImageSize(800, 600);
    const screen = await render(<ExercisePicture uri="https://example.com/squat.jpg" />);
    const image = frameOf(screen);

    expect(image.props.resizeMode).toBe('contain');
  });

  it("gives the frame the picture's own proportions, not a fixed height", async () => {
    mockImageSize(800, 600);
    const wide = frameOf(await render(<ExercisePicture uri="https://example.com/wide.jpg" />));

    expect(StyleSheet.flatten(wide.props.style).aspectRatio).toBeCloseTo(4 / 3);
    expect(StyleSheet.flatten(wide.props.style).height).toBeUndefined();

    mockImageSize(600, 800);
    const tall = frameOf(await render(<ExercisePicture uri="https://example.com/tall.jpg" />));

    expect(StyleSheet.flatten(tall.props.style).aspectRatio).toBeCloseTo(3 / 4);
  });

  it('keeps a very tall or very wide picture from taking over the screen — it is letterboxed instead', async () => {
    mockImageSize(4000, 400);
    const veryWide = frameOf(await render(<ExercisePicture uri="https://example.com/panorama.jpg" />));
    expect(StyleSheet.flatten(veryWide.props.style).aspectRatio).toBeCloseTo(16 / 9);

    mockImageSize(400, 4000);
    const veryTall = frameOf(await render(<ExercisePicture uri="https://example.com/column.jpg" />));
    expect(StyleSheet.flatten(veryTall.props.style).aspectRatio).toBeCloseTo(3 / 4);
  });

  it('fills its container by default, and takes a narrower width when given one — centered', async () => {
    mockImageSize(800, 600);
    const full = frameOf(await render(<ExercisePicture uri="https://example.com/a.jpg" />));
    const small = frameOf(await render(<ExercisePicture uri="https://example.com/b.jpg" width="60%" />));

    expect(StyleSheet.flatten(full.props.style).width).toBe('100%');
    expect(StyleSheet.flatten(small.props.style).width).toBe('60%');
    expect(StyleSheet.flatten(small.props.style).alignSelf).toBe('center');
  });

  it('holds a default frame until it knows the size, and when it cannot find it out', async () => {
    jest.spyOn(Image, 'getSize').mockImplementation(((_uri: string, _success: unknown, failure: () => void) => {
      failure();
    }) as never);
    const image = frameOf(await render(<ExercisePicture uri="https://example.com/broken.jpg" />));

    expect(StyleSheet.flatten(image.props.style).aspectRatio).toBeCloseTo(4 / 3);
  });
});

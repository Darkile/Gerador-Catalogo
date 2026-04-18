export async function getImageRatio(file: File): Promise<number | null> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Não foi possível ler dimensão da imagem."));
      image.src = objectUrl;
    });

    if (!image.width || !image.height) {
      return null;
    }

    return image.width / image.height;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

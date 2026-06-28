import { useEffect, useState } from "react";
import { Banner } from "@/components/banner";
import { CardBook } from "@/components/card-book";
import { BookStoreSkeletonGrid } from "@/components/card-skeletons";
import { fetchBooks } from "@/services/books";
import type { Book } from "@/types/database";

export function BookstorePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await fetchBooks();
        setBooks(data);
      } catch (error) {
        console.error("Erro ao carregar livros:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadBooks();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <BookStoreSkeletonGrid count={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <Banner location="bookstore" />

      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Livraria</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Livros selecionados para complementar sua jornada de estudos.
          </p>
        </div>

        {books.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum livro disponível no momento.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {books.map((book) => (
              <CardBook key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

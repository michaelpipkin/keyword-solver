import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  ChangeDetectionStrategy,
  Component,
  signal,
  WritableSignal,
} from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'WaPo Keyword Solver';
  private abortController: AbortController | null = null;

  firstLetter = signal<string>('');
  secondLetter = signal<string>('');
  thirdLetter = signal<string>('');
  fourthLetter = signal<string>('');
  fifthLetter = signal<string>('');
  sixthLetter = signal<string>('');
  results = signal<string>('');
  foundWord = signal<boolean>(false);
  isSearching = signal<boolean>(false);

  private readonly letterSignals: Record<string, WritableSignal<string>> = {
    firstLetter: this.firstLetter,
    secondLetter: this.secondLetter,
    thirdLetter: this.thirdLetter,
    fourthLetter: this.fourthLetter,
    fifthLetter: this.fifthLetter,
    sixthLetter: this.sixthLetter,
  };

  onBlur(target: EventTarget | null, letter: string) {
    const value = (target as HTMLInputElement)?.value;
    if (value && value.length > 0) {
      const transformedText = value
        .toUpperCase()
        .replace(/\s/g, '') // Replace all whitespace characters
        .split('')
        .filter(
          (char: string, index: number, self: string[]) =>
            self.indexOf(char) === index
        ) // Get unique characters
        .sort()
        .join('');
      this.letterSignals[letter]?.set(transformedText);
    }
  }

  async onSubmit() {
    this.abortController = new AbortController();
    if (
      this.firstLetter().length === 0 ||
      this.secondLetter().length === 0 ||
      this.thirdLetter().length === 0 ||
      this.fourthLetter().length === 0 ||
      this.fifthLetter().length === 0 ||
      this.sixthLetter().length === 0
    ) {
      this.results.set('All fields must contain at least one letter.');
      return;
    }
    this.foundWord.set(false);
    this.isSearching.set(true);
    await this.findWord(this.abortController.signal).then(() => {
      if (!this.foundWord() && this.results() !== 'Search cancelled.') {
        this.results.set('No valid words found.');
      }
      this.isSearching.set(false);
    });
  }

  async findWord(abortSignal?: AbortSignal): Promise<void> {
    let isFirst = true;
    for (const firstLetter of this.firstLetter().split('')) {
      for (const secondLetter of this.secondLetter().split('')) {
        for (const thirdLetter of this.thirdLetter().split('')) {
          for (const fourthLetter of this.fourthLetter().split('')) {
            for (const fifthLetter of this.fifthLetter().split('')) {
              for (const sixthLetter of this.sixthLetter().split('')) {
                if (!isFirst) await this.delay(500);
                isFirst = false;
                const keyword = `${firstLetter}${secondLetter}${thirdLetter}${fourthLetter}${fifthLetter}${sixthLetter}`;
                const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${keyword.toLowerCase()}`;
                try {
                  const response = await fetch(url, { signal: abortSignal });
                  switch (response.status) {
                    case 200: // Found the word!
                      this.results.set(`*** ${keyword} ***`);
                      this.foundWord.set(true);
                      return;
                    case 404: // Word not found
                      this.results.set(`${keyword} `);
                      break;
                    case 429: // Too many requests
                      this.results.set(
                        `Too many requests. Please try again in a few minutes.`
                      );
                      return;
                    default:
                      this.results.set(
                        `Error ${response.status}: ${response.statusText}. Please try again.`
                      );
                      return;
                  }
                } catch (error: any) {
                  if (error.name === 'AbortError') {
                    this.results.set('Search cancelled.');
                    return;
                  }
                  this.results.set(
                    `Error: ${error.message}. Please try again.`
                  );
                  return;
                }
              }
            }
          }
        }
      }
    }
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  onClear() {
    this.firstLetter.set('');
    this.secondLetter.set('');
    this.thirdLetter.set('');
    this.fourthLetter.set('');
    this.fifthLetter.set('');
    this.sixthLetter.set('');
    this.results.set('');
  }

  onCancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null; // Reset for future use
      this.results.set('Search cancelled.');
    }
  }
}

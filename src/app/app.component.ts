import { FormsModule } from '@angular/forms';
import {
  MatButton,
  MatButtonModule,
  MatIconButton,
} from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import {
  Component,
  ElementRef,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
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
  [key: string]: any;
  private abortController: AbortController | null = null;

  firstLetter = model<string>('');
  secondLetter = model<string>('');
  thirdLetter = model<string>('');
  fourthLetter = model<string>('');
  fifthLetter = model<string>('');
  sixthLetter = model<string>('');
  results = model<string>('');

  foundWord = signal<boolean>(false);

  findButton = viewChild.required<MatButton>('findButton');
  clearButton = viewChild.required<MatButton>('clearButton');
  cancelButton = viewChild.required<MatButton>('cancelButton');
  inputs = viewChildren<ElementRef>('letterTextbox');
  resetButtons = viewChildren<MatIconButton>('resetButton');

  onBlur(target: any, letter: string) {
    const value = target.value;
    if (value.length > 0) {
      let transformedText = value
        .toUpperCase()
        .replace(/\s/g, '') // Replace all whitespace characters
        .split('')
        .filter(
          (char: any, index: any, self: string | any[]) =>
            self.indexOf(char) === index
        ) // Get unique characters
        .sort()
        .join('');
      this[letter].set(transformedText);
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
    this.findButton().disabled = true;
    this.clearButton().disabled = true;
    this.cancelButton().disabled = false;
    this.inputs().forEach((input) => (input.nativeElement.disabled = true));
    this.resetButtons().forEach((button) => (button.disabled = true));
    await this.findWord(this.abortController.signal).then(() => {
      if (!this.foundWord() && this.results() !== 'Search cancelled.') {
        this.results.set('No valid words found.');
      }
      this.findButton().disabled = false;
      this.clearButton().disabled = false;
      this.cancelButton().disabled = true;
      this.inputs().forEach((input) => (input.nativeElement.disabled = false));
      this.resetButtons().forEach((button) => (button.disabled = false));
    });
  }

  async findWord(abortSignal?: AbortSignal) {
    for (const firstLetter of this.firstLetter().split('')) {
      for (const secondLetter of this.secondLetter().split('')) {
        for (const thirdLetter of this.thirdLetter().split('')) {
          for (const fourthLetter of this.fourthLetter().split('')) {
            for (const fifthLetter of this.fifthLetter().split('')) {
              for (const sixthLetter of this.sixthLetter().split('')) {
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
                await this.delay(1000);
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

import { Subject } from "rxjs";

export default function testRxjs(): void {
  const subject = new Subject<number>();

  subject.subscribe({
    next: (v) => console.log(`observerA: ${v}`),
  });
  subject.subscribe({
    next: (v) => console.log(`observerB: ${v}`),
  });

  subject.next(1);
  subject.next(2);
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmMessage } from './confirm-message';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MockTranslateService } from '../../test-utils/mock-translate.service';

describe('ConfirmMessage', () => {
  let component: ConfirmMessage;
  let fixture: ComponentFixture<ConfirmMessage>;
  let mockTranslate: MockTranslateService;
  let settingsSubject: BehaviorSubject<{ language: string }>;

  beforeEach(async () => {
    mockTranslate = new MockTranslateService();
    settingsSubject = new BehaviorSubject({ language: 'en' });

    await TestBed.configureTestingModule({
      declarations: [ConfirmMessage],
      imports: [TranslateModule.forRoot()],
      providers: [{ provide: TranslateService, useValue: mockTranslate }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmMessage);
    component = fixture.componentInstance;

    // input
    component.message = 'Delete';
    component.type = 'cancel';

    (component as any).settings$ = settingsSubject.asObservable();

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render type and message', () => {
    const root: HTMLElement = fixture.nativeElement;
    const h4 = root.querySelector('h4')!;
    const p = root.querySelector('p')!;
    const deleteBtn = root.querySelector('button.delete')!;
    const cancelBtn = root.querySelector('button.cancel')!;

    expect(h4.textContent).toContain('confirmMessage.warning');
    expect(p.textContent).toContain('confirmMessage.areYouSure');
    expect(p.textContent).toContain('cancel');
    expect(deleteBtn.textContent).toContain('Delete');
    expect(cancelBtn.textContent).toContain('actions.cancel');
  });

  it('confirmButton() should emit confirm event', () => {
    const spy = jasmine.createSpy('confirmSpy');
    component.confirm.subscribe(spy);

    component.confirmButton();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('cancelButton() should emit cancel event', () => {
    const spy = jasmine.createSpy('cancelSpy');
    component.cancel.subscribe(spy);

    component.cancelButton();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('clicking the delete button triggers confirm emission', () => {
    const spy = jasmine.createSpy('confirmSpy');
    component.confirm.subscribe(spy);

    const root: HTMLElement = fixture.nativeElement;
    const deleteBtn = root.querySelector('button.delete') as HTMLButtonElement | null;
    expect(deleteBtn).toBeTruthy();

    deleteBtn!.click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('clicking the cancel button triggers cancel emission', () => {
    const spy = jasmine.createSpy('cancelSpy');
    component.cancel.subscribe(spy);

    const root: HTMLElement = fixture.nativeElement;
    const cancelBtn = root.querySelector('button.cancel') as HTMLButtonElement | null;
    expect(cancelBtn).toBeTruthy();

    cancelBtn!.click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

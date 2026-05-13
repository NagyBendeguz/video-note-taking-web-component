import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpToggle } from './help-toggle';

describe('HelpToggle', () => {
  let fixture: ComponentFixture<HelpToggle>;
  let component: HelpToggle;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HelpToggle],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpToggle);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('has default inputs', () => {
    expect(component.key).toBe('');
    expect(component.isActive).toBeFalse();
  });

  it('onToggle() emits the key via toggle EventEmitter', () => {
    component.key = 'my-key';
    spyOn(component.toggle, 'emit');
    component.onToggle();
    expect(component.toggle.emit).toHaveBeenCalledOnceWith('my-key');
  });

  it('onKeyDown() triggers on Enter key', () => {
    spyOn(component, 'onToggle');
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onKeyDown(enterEvent);
    expect(component.onToggle).toHaveBeenCalled();
  });

  it('onKeyDown() does not trigger on other keys', () => {
    spyOn(component, 'onToggle');
    const otherEvent = new KeyboardEvent('keydown', { key: 'a' });
    component.onKeyDown(otherEvent);
    expect(component.onToggle).not.toHaveBeenCalled();
  });
});

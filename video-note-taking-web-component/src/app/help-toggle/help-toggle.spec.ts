import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpToggle } from './help-toggle';

describe('HelpToggle', () => {
  let component: HelpToggle;
  let fixture: ComponentFixture<HelpToggle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HelpToggle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpToggle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

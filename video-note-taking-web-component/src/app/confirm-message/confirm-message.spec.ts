import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmMessage } from './confirm-message';

describe('ConfirmMessage', () => {
  let component: ConfirmMessage;
  let fixture: ComponentFixture<ConfirmMessage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmMessage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmMessage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendedView } from './extended-view';

describe('ExtendedView', () => {
  let component: ExtendedView;
  let fixture: ComponentFixture<ExtendedView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExtendedView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtendedView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditingView } from './editing-view';

describe('EditingView', () => {
  let component: EditingView;
  let fixture: ComponentFixture<EditingView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditingView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditingView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

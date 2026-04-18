import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompressedView } from './compressed-view';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('CompressedView', () => {
  let component: CompressedView;
  let fixture: ComponentFixture<CompressedView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompressedView],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompressedView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

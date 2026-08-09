import React from "react";
import styled from "styled-components";
import { Filter, Search, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 50;
  min-height: 60px;
  border-bottom-left-radius: ${({ theme }) => theme.borderRadius.md};
  border-bottom-right-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 16px 24px;
    min-height: 70px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text};

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: ${({ theme }) => theme.fontSizes.xxl};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text};

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Header = ({
  title,
  showBack,
  showFilter,
  showSearch,
  onFilterClick,
  onSearchClick,
}) => {
  const navigate = useNavigate();

  return (
    <HeaderContainer>
      <LeftSection>
        {showBack && (
          <BackButton onClick={() => navigate(-1)}>
            <ChevronLeft />
          </BackButton>
        )}
        <Title>{title}</Title>
      </LeftSection>

      <RightSection>
        {showFilter && (
          <IconButton onClick={onFilterClick}>
            <Filter />
          </IconButton>
        )}
        {showSearch && (
          <IconButton onClick={onSearchClick}>
            <Search />
          </IconButton>
        )}
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
